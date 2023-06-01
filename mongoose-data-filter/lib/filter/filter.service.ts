import { Injectable, Type } from "@nestjs/common";
import * as mongoose from "mongoose";
import { Model } from "mongoose";
import { ExportTypes } from "..";
import { AccessControlAdapter } from "../adapters/access-control.adapter";
import { TranslateAdapter } from "../adapters/translate.adapter";
import { DataFilterRepository } from "../data-filter.repository";
import { DataFilterService } from "../data-filter.service";
import { AddFieldModel } from "../models/add-field.model";
import { FilterQueryModel, FilterResultModel, FilterSearchModel, OrderModel } from "../models/filter.model";
import { DataFilterUserModel } from "../models/user.model";
import { MongoUtils } from "../mongo.utils";
import { MongoSchemaScanner } from "../scanners/mongo-schema.scanner";
import { BaseFilter } from "./base-filter";
import { FilterUtils } from "./filter.utils";
import { Filter, FilterDefinition, SelectFilter, SelectFilterValue } from "./filters";
import { GroupFilter, GroupFilterDefinition } from "./filters/group.filter";
import { QueryModel, QueryRuleModel } from "./models";
import { FilterConfigurationSearchModel } from "./models/filter-configuration-search.model";
import { FilterConfigurationModel } from "./models/filter-configuration.model";
import { FilterResourceValueModel } from "./models/filter-resource-value.model";
import { SortRule, SortRuleDefinition } from "./sort-rules/sort-rule";
import { RequestInfo } from "./types/request-info.type";

@Injectable()
export class FilterService<Data> {
    private definitions: { [name: string]: FilterDefinition | GroupFilterDefinition | SortRuleDefinition };
    private repository: DataFilterRepository<Data>;

    constructor(
        private accessControlAdapter: AccessControlAdapter,
        private translateAdapter: TranslateAdapter,
        private model: BaseFilter<Data>,
        private mongoSchemaScanner: MongoSchemaScanner,
        private dataFilter: DataFilterService
    ) {
        this.init();
    }

    public forData<T>(dataDef: Type<T>): FilterService<T> {
        return new FilterService(
            this.accessControlAdapter,
            this.translateAdapter,
            {
                ...this.model,
                dataDefinition: dataDef
            } as BaseFilter<T>,
            this.mongoSchemaScanner,
            this.dataFilter
        );
    }

    public async getConfig(requestInfo: RequestInfo): Promise<FilterConfigurationModel[]> {
        const result: FilterConfigurationModel[] = [];
        for (const key in this.definitions) {
            if (!this.definitions.hasOwnProperty(key)) {
                continue;
            }

            const filter = this.definitions[key];
            if (SortRule.validate(filter as SortRuleDefinition)) {
                continue;
            }
            const config = await (filter as FilterDefinition).getConfig(key, requestInfo);

            result.push({
                ...config,
                id: key,
                name: await this.translateAdapter.getTranslation(requestInfo.user.language, FilterUtils.getFilterTranslationKey(key))
            });
        }

        return result;
    }

    public async searchConfigValues(search: FilterConfigurationSearchModel, requestInfo: RequestInfo): Promise<SelectFilterValue[]> {
        if (!this.definitions.hasOwnProperty(search.id)) {
            return [];
        }

        const filter = this.definitions[search.id];
        if (filter instanceof SelectFilter) {
            return await filter.values({ value: search.value, ...requestInfo });
        }

        return [];
    }

    public async findResourceValueById(search: FilterResourceValueModel, requestInfo: RequestInfo): Promise<SelectFilterValue> {
        if (!this.definitions.hasOwnProperty(search.id)) {
            return;
        }

        const filter = this.definitions[search.id];
        if (filter instanceof SelectFilter && filter.getResourceById) {
            return await filter.getResourceById({ id: search.resourceId, ...requestInfo });
        }

        return;
    }

    public async count(user: DataFilterUserModel, options: FilterQueryModel): Promise<number>;
    public async count(options: FilterQueryModel): Promise<number>;
    public async count(...args: [DataFilterUserModel | FilterQueryModel, FilterQueryModel?]): Promise<number> {
        const [userOrOpt, opt] = args;
        const options = opt ? opt : (userOrOpt as FilterQueryModel);
        const user = opt ? (userOrOpt as DataFilterUserModel) : null;

        const pipeline = await this.getFilterPipeline(this.repository.model, options);
        return user ? this.countTotalValues(user, pipeline) : this.countTotalValues(pipeline);
    }

    public async filter(user: DataFilterUserModel, options: FilterQueryModel): Promise<FilterResultModel<Data>>;
    public async filter(options: FilterQueryModel): Promise<FilterResultModel<Data>>;
    public async filter(...args: [DataFilterUserModel | FilterQueryModel, FilterQueryModel?]): Promise<FilterResultModel<Data>> {
        const [userOrOpt, opt] = args;
        const options = opt ? opt : (userOrOpt as FilterQueryModel);
        const user = opt ? (userOrOpt as DataFilterUserModel) : null;

        const pipeline = await this.getFilterPipeline(this.repository.model, options);

        const total = await (user ? this.countTotalValues(user, pipeline) : this.countTotalValues(pipeline));
        const values = await (user ? this.findValues(user, options, pipeline) : this.findValues(options, pipeline));
        return {
            total,
            page: options.page,
            values
        };
    }

    public async downloadData(
        user: DataFilterUserModel,
        type: ExportTypes,
        options: FilterQueryModel,
        exportOptions?: object
    ): Promise<Buffer | string> {
        const findOptions = await this.getFilterPipeline(this.repository.model, options, options?.data);
        delete options.page;
        const values = await this.findValues(user, options, findOptions);
        return await this.repository.downloadData(values, type, user.language, exportOptions);
    }

    public async getFilterPipeline(model: Model<any>, options: FilterQueryModel, data?: object): Promise<any[]> {
        options.query = this.addDefaultFilter(options.query);

        const pipeline = [];
        const queryLookups = await this.getLookups(model, options.query, data);
        const searchLookups = options.search?.value?.length ? await this.getSearchableLookups(model) : [];
        const orderLookups = MongoUtils.mergeLookups(
            this.getSortLookups(model, options.order ?? this.model.defaultOrder, data),
            searchLookups
        );
        pipeline.push(...MongoUtils.mergeLookups(queryLookups, orderLookups));

        const match: any = {};
        const searchConditions: mongoose.FilterQuery<any>[] = [];
        if (options.search?.value?.length) {
            match.$match = { $and: searchConditions };

            searchConditions.push(this.generateSearchOptions(options.search));
        }

        const matchConditions: mongoose.FilterQuery<any>[] = [];
        await this.generateMatchOptions(options.query, matchConditions);

        if (!match.$match && matchConditions.length) {
            match.$match = options.query.condition === "and" ? { $and: matchConditions } : { $or: matchConditions };
        } else if (matchConditions.length) {
            searchConditions.push({
                [`$${options.query.condition}`]: matchConditions
            });
        }

        if (match.$match) {
            pipeline.push(match);
        }

        return pipeline;
    }

    public async getSearchableLookups(model: Model<any>): Promise<any[]> {
        const paths = this.model.searchableFields?.filter((x) => x.path).map((x) => x.path);
        if (!paths?.length) {
            return [];
        }

        const lookups: any[][] = [];
        for (const path of paths) {
            lookups.push(this.mongoSchemaScanner.getLookups(model.schema, { path }, []));
        }
        return MongoUtils.reduceLookups(lookups);
    }

    private init() {
        this.repository = this.dataFilter.for(this.model.dataDefinition);
        this.model.translateService = this.translateAdapter;

        this.definitions = {};
        for (const key in this.model) {
            if (!this.model.hasOwnProperty(key)) {
                continue;
            }

            if (
                !Filter.validate(this.model[key] as FilterDefinition) &&
                !GroupFilter.validate(this.model[key] as GroupFilterDefinition) &&
                !SortRule.validate(this.model[key] as SortRuleDefinition)
            ) {
                continue;
            }

            this.definitions[key] = this.model[key] as FilterDefinition;
        }
    }

    private async getLookups(model: Model<any>, query: QueryModel, data?: object): Promise<any[]> {
        if (!query?.rules) {
            return [];
        }

        const lookups: any[][] = [];
        for (const rule of query.rules) {
            const m = rule as QueryModel;
            if (m.condition) {
                lookups.push(await this.getLookups(model, m, data));
                continue;
            }

            const r = rule as QueryRuleModel;
            if (!this.definitions.hasOwnProperty(r.id)) {
                continue;
            }

            const filter = this.definitions[r.id];
            if ((filter as GroupFilterDefinition).rootFilter) {
                const f = filter as GroupFilterDefinition;
                lookups.push(...this.getFilterLookups(model, f.rootFilter));

                if (!f.lazyLoading) {
                    lookups.push(...this.getFilterLookups(model, f.valueFilter));
                } else {
                    const valueFiler = await f.getValueFilter(r.value[0]);
                    lookups.push(...this.getFilterLookups(model, valueFiler as FilterDefinition));
                }
            } else {
                lookups.push(...this.getFilterLookups(model, filter as FilterDefinition));
            }
        }
        return MongoUtils.reduceLookups(lookups);
    }

    private async generateMatchOptions(query: QueryModel, filters: mongoose.FilterQuery<any>[]): Promise<void> {
        if (!query?.rules) {
            return;
        }

        for (const rule of query.rules) {
            const c = rule as QueryModel;
            if (c.condition) {
                const conditions: mongoose.FilterQuery<any>[] = [];
                const op = c.condition === "and" ? "$and" : "$or";
                const where: mongoose.FilterQuery<any> = { [op]: conditions };
                await this.generateMatchOptions(c, conditions);

                if (where[op as any].length) {
                    filters.push(where);
                }

                continue;
            }

            const r = rule as QueryRuleModel;
            if (!this.definitions.hasOwnProperty(r.id)) {
                continue;
            }

            const filter = this.definitions[r.id] as FilterDefinition;
            if (!SortRule.validate(filter)) {
                const filterOptions = await filter.getMatchOptions(r);
                if (filterOptions) {
                    filters.push(filterOptions);
                }
            }
        }
    }

    private generateSearchOptions(search: FilterSearchModel): object {
        if (!search?.value?.length || !this.model.searchableFields?.length) {
            return;
        }

        const generateFieldsObject = (searchValue) =>
            this.model.searchableFields.map((a) => {
                const attribute = a.path ? `${a.path}.${a.attribute}` : a.attribute;
                return {
                    [attribute]: new RegExp(`.*${searchValue}.*`, "i")
                };
            });

        const tokens = search.value.split(" ");
        return {
            $or: tokens.map((t) => {
                return {
                    $or: generateFieldsObject(t)
                };
            })
        };
    }

    private async countTotalValues(user: DataFilterUserModel, pipeline: any[]): Promise<number>;
    private async countTotalValues(pipeline: any[]): Promise<number>;
    private async countTotalValues(...args: [DataFilterUserModel | any[], any[]?]): Promise<number> {
        const [userOrOpt, opt] = args;
        const pipeline = opt ? opt : (userOrOpt as any[]);

        /**
         * This means that countTotalValues was called with a user
         */
        if (opt) {
            await this.setAccessControlMatchCondition(pipeline, userOrOpt as DataFilterUserModel);
        }

        const result = await this.repository.model.aggregate(pipeline).count("total").exec();
        return result?.[0]?.total;
    }

    private async findValues<Users extends DataFilterUserModel>(user: Users, filter: FilterQueryModel, pipeline: any[]): Promise<Data[]>;
    private async findValues<Users extends DataFilterUserModel>(filter: FilterQueryModel, pipeline: any[]): Promise<Data[]>;
    private async findValues<Users extends DataFilterUserModel>(
        ...args: [Users | FilterQueryModel, FilterQueryModel | any[], any[]?]
    ): Promise<Data[]> {
        const [userOrOFilter, filterOrOpt, opt] = args;
        const pipeline = opt ? opt : (filterOrOpt as any[]);
        const filter = opt ? (filterOrOpt as FilterQueryModel) : (userOrOFilter as FilterQueryModel);

        /**
         * This means that findValues was called with a user
         */
        if (opt) {
            await this.setAccessControlMatchCondition(pipeline, userOrOFilter as Users);
        }

        const { sort, fieldsToAdd } = this.getSortOption(filter.order);
        let aggregation = this.repository.model.aggregate(pipeline);
        if (sort) {
            if (fieldsToAdd?.length) {
                aggregation = aggregation.addFields(MongoUtils.reduceFieldsToAdd(fieldsToAdd));
            }

            aggregation = aggregation.sort(sort);
        }
        if (filter.page) {
            aggregation = aggregation.skip(filter.page.number * filter.page.size).limit(filter.page.size);
        }

        const values = await aggregation.exec();
        return await this.repository.find(
            {
                _id: {
                    $in: values.map((x) => x._id)
                }
            } as any,
            null,
            {
                sort
            },
            null,
            fieldsToAdd
        );
    }

    private async setAccessControlMatchCondition(pipeline: any[], user: DataFilterUserModel): Promise<void> {
        if (!user) {
            throw new Error("No user found");
        } else if (!this.accessControlAdapter) {
            throw new Error("AccessControl isn't enable in your project");
        }

        const ids = await this.accessControlAdapter.getResourceIds(this.repository.model, user);
        let match = pipeline.find((x) => x.$match);
        if (!match) {
            match = {
                $match: {}
            };
        }
        match.$match = {
            ...match.$match,
            _id: {
                $in: ids
            }
        };
    }

    private getFilterLookups(model: Model<any>, filter: FilterDefinition): any[][] {
        if (!filter.path) {
            return [];
        }

        return [this.mongoSchemaScanner.getLookups(model.schema, { path: filter.path }, [])];
    }

    private getSortLookups(model: Model<any>, order: OrderModel | OrderModel[], data?: object): any[] {
        if (!Array.isArray(order)) {
            order = [order];
        }

        const orders = [];
        for (const ord of order) {
            if (!ord?.column || ord?.direction === "") {
                continue;
            }

            const rule = this.definitions[ord.column] as SortRuleDefinition;
            if (rule && rule.path && SortRule.validate(rule)) {
                orders.push(
                    this.mongoSchemaScanner.getLookups(model.schema, {
                        path: rule.path,
                        where: rule.where
                    }, [])
                );
            } else {
                orders.push(this.repository.generateOrderLookup(ord, data));
            }
        }

        return orders;
    }

    private getSortOption(orderObj: OrderModel | OrderModel[]): {
        sort: string,
        fieldsToAdd: AddFieldModel[]
    } {
        if (!Array.isArray(orderObj)) {
            orderObj = [orderObj];
        }

        if (!orderObj?.length) {
            orderObj = [this.model.defaultOrder];
        }

        const sorts: string[] = [];
        const fieldsToAdd: AddFieldModel[] = [];

        for (const ord of orderObj) {
            if (!ord?.column || !ord.direction) {
                continue;
            }

            // https://mongoosejs.com/docs/5.x/docs/api/aggregate.html#aggregate_Aggregate-sort
            const directionPrefix = ord.direction === "asc" ? "" : "-";
            const rule = this.definitions[ord.column] as SortRuleDefinition;

            if (!rule || !SortRule.validate(rule)) {
                sorts.push(`${directionPrefix}${ord.column}`);
            } else {
                sorts.push(`${directionPrefix}${rule.getSortOption()}`);
                fieldsToAdd.push(...rule.getFieldsToAdd(ord));
            }
        }

        return {
            sort: sorts.join(" "),
            fieldsToAdd
        };
    }

    private addDefaultFilter(query: QueryModel): QueryModel {
        if (!this.model.defaultFilter) {
            return query;
        }

        if (this.model.defaultFilter.required) {
            if (query?.condition !== "and") {
                query = {
                    condition: "and",
                    rules: [query]
                };
            }
        } else {
            if (query?.condition !== "or") {
                query = {
                    condition: "or",
                    rules: [query]
                };
            }
        }
        query.rules.push(this.model.defaultFilter.filter);
        return query;
    }
}
