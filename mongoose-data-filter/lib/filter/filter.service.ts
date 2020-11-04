import { Injectable, Type } from "@nestjs/common";
import * as mongoose from "mongoose";
import { Aggregate, Model } from "mongoose";
import { FilterSearchModel } from "../../../data-filter/lib";
import { AccessControlAdapter } from "../adapters/access-control.adapter";
import { TranslateAdapter } from "../adapters/translate.adapter";
import { DataFilterRepository } from "../data-filter.repository";
import { DataFilterService } from "../data-filter.service";
import { FilterQueryModel, FilterResultModel } from "../models/filter.model";
import { DataFilterUserModel } from "../models/user.model";
import { MongoUtils } from "../mongo.utils";
import { MongoSchemaScanner } from "../scanners/mongo-schema.scanner";
import { BaseFilter } from "./base-filter";
import { FilterUtils } from "./filter.utils";
import { Filter, FilterDefinition } from "./filters";
import { GroupFilter, GroupFilterDefinition } from "./filters/group.filter";
import { QueryModel, QueryRuleModel } from "./models";
import { FilterConfigurationSearchModel } from "./models/filter-configuration-search.model";
import { FilterConfigurationModel } from "./models/filter-configuration.model";
import { FilterResourceValueModel } from "./models/filter-resource-value.model";

@Injectable()
export class FilterService<Data> {
    private definitions: { [name: string]: FilterDefinition | GroupFilterDefinition };
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

    public async getConfig(user?: DataFilterUserModel): Promise<FilterConfigurationModel[]> {
        const result: FilterConfigurationModel[] = [];
        for (const key in this.definitions) {
            if (!this.definitions.hasOwnProperty(key) || OrderRule.validate(this.definitions[key] as OrderRuleDefinition)) {
                continue;
            }

            const config = await (this.definitions[key] as FilterDefinition).getConfig(key, user);
            result.push({
                ...config,
                id: key,
                name: await this.translateAdapter.getTranslation(user.language, FilterUtils.getFilterTranslationKey(key))
            });
        }

        return result;
    }

    public async searchConfigValues(
        search: FilterConfigurationSearchModel,
        user?: DataFilterUserModel
    ): Promise<SelectFilterValue[]> {
        if (!this.definitions.hasOwnProperty(search.id)) {
            return [];
        }

        const filter = this.definitions[search.id];
        if (filter instanceof SelectFilter) {
            return await filter.values(search.value, user);
        }

        return [];
    }

    public async findResourceValueById(search: FilterResourceValueModel, user?: DataFilterUserModel): Promise<SelectFilterValue> {
        if (!this.definitions.hasOwnProperty(search.id)) {
            return;
        }

        const filter = this.definitions[search.id];
        if (filter instanceof SelectFilter && filter.getResourceById) {
            return await filter.getResourceById(search.resourceId, user);
        }

        return;
    }

    public async count(user: DataFilterUserModel, options: FilterQueryModel): Promise<number>;
    public async count(options: FilterQueryModel): Promise<number>;
    public async count(...args: [DataFilterUserModel | FilterQueryModel, FilterQueryModel?]): Promise<number> {
        const [userOrOpt, opt] = args;
        const options = opt ? opt : userOrOpt as FilterQueryModel;
        const user = opt ? userOrOpt as DataFilterUserModel : null;

        const countOptions = await this.getFindOptions(this.repository.model, options.query);
        this.addSearchCondition(options.search, countOptions);
        return user ? this.countTotalValues(user, countOptions) : this.countTotalValues(countOptions);
    }

    public async filter(user: DataFilterUserModel, options: FilterQueryModel): Promise<FilterResultModel<Data>>;
    public async filter(options: FilterQueryModel): Promise<FilterResultModel<Data>>;
    public async filter(...args: [DataFilterUserModel | FilterQueryModel, FilterQueryModel?]): Promise<FilterResultModel<Data>> {
        const [userOrOpt, opt] = args;
        const options = opt ? opt : userOrOpt as FilterQueryModel;
        const user = opt ? userOrOpt as DataFilterUserModel : null;

        const countOptions = await this.getFindOptions(this.repository.model, options.query, options.data);
        this.addSearchCondition(options.search, countOptions);
        this.addOrderCondition(options.order, countOptions);

        const total = await (user ? this.countTotalValues(user, countOptions) : this.countTotalValues(countOptions));
        const values = await (user ? this.findValues(user, options, countOptions) : this.findValues(options, countOptions));
        return {
            total,
            page: options.page,
            values
        };
    }

    public async getFilterPipeline(model: Model<any>, options: FilterQueryModel, data?: object): Promise<any[]> {
        const pipeline = [];
        const queryLookups = await this.getLookups(model, options.query, data);
        const searchLookups = options.search?.value?.length ? this.repository.getLookups() : [];
        pipeline.push(...MongoUtils.mergeLookups(queryLookups, searchLookups));

        if (options.search?.value?.length) {

        }

        const matchConditions: mongoose.FilterQuery<any>[] = [];
        const match = {
            $match: query.condition === "and" ? { "$and": matchConditions } : { "$or": matchConditions }
        }
        await this.generateMatchOptions(query, matchConditions);
        return [
            ...await this.getLookups(model, query, data),
            match
        ];
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
                !GroupFilter.validate(this.model[key] as GroupFilterDefinition)
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
                    lookups.push(...this.getFilterLookups(model, valueFiler as FilterDefinition))
                }
            } else {
                lookups.push(...this.getFilterLookups(model, filter as FilterDefinition));
            }
        }
        return MongoUtils.reduceLookups(lookups);
    }

    private async generateMatchOptions(query: QueryModel, filters: mongoose.FilterQuery<any>[]): Promise<void> {
        if (!query.rules) {
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
            const filterOptions = await filter.getMatchOptions(r);
            if (filterOptions) {
                filters.push(filterOptions);
            }
        }
    }

    private addSearchCondition(search: FilterSearchModel, options: CountOptions): void {
        if (!search?.value?.length) {
            return;
        }

        const repoOption = this.repository.generateFindOptions({});
        options.include = SequelizeUtils.mergeIncludes(
            options.include as IncludeOptions[],
            repoOption.include as IncludeOptions[]
        );

        if (!options.where) {
            options.where = { [Op.and]: [] };
        }

        const where = options.where;
        const generateFieldsObject = searchValue =>
            this.repository
                .getSearchAttributes()
                .map(a => {
                    return {
                        [a.key]: {
                            [Op.like]: `%${searchValue}%`
                        }
                    };
                })
                .reduce((a, o) => Object.assign(a, o), {});

        const tokens = search.value.split(" ");
        where[Op.and].push(
            tokens.map(t => {
                return {
                    [Op.or]: generateFieldsObject(t)
                };
            })
        );
    }

    private async countTotalValues(user: DataFilterUserModel, options: FindOptions): Promise<number>;
    private async countTotalValues(options: FindOptions): Promise<number>;
    private async countTotalValues(...args: [DataFilterUserModel | FindOptions, FindOptions?]): Promise<number> {
        const [userOrOpt, opt] = args;
        const options = opt ? opt : userOrOpt as FindOptions;

        /**
         * This means that countTotalValues was called with a user
         */
        if (opt) {
            options.where = await this.getAccessControlWhereCondition(options.where, userOrOpt as DataFilterUserModel);
        }

        if (options.having) {
            const data = await this.repository.model.findAll({
                ...options,
                subQuery: false
            });
            return data.length;
        } else {
            const value = await this.repository.model.count({
                ...options
            }) as any;
            if (typeof value === "number") {
                return value;
            } else {
                return value.length;
            }
        }
    }

    private async findValues<Users extends DataFilterUserModel>(user: Users, filter: FilterQueryModel, options: FindOptions): Promise<Data[]>;
    private async findValues<Users extends DataFilterUserModel>(filter: FilterQueryModel, options: FindOptions): Promise<Data[]>;
    private async findValues<Users extends DataFilterUserModel>(...args: [Users | FilterQueryModel, FilterQueryModel | FindOptions, FindOptions?]): Promise<Data[]> {
        const [userOrOFilter, filterOrOpt, opt] = args;
        const options = opt ? opt : filterOrOpt as FindOptions;
        const filter = opt ? filterOrOpt as FilterQueryModel : userOrOFilter as FilterQueryModel;

        /**
         * This means that findValues was called with a user
         */
        if (opt) {
            options.where = await this.getAccessControlWhereCondition(options.where, userOrOFilter as Users);
        }

        const order = this.getOrderOptions(filter.order);
        const values = await this.repository.model.findAll({
            ...options,
            limit: filter.page ? filter.page.size : null,
            offset: filter.page ? filter.page.number * filter.page.size : null,
            subQuery: false,
            order
        });
        return await this.repository.findAll({
            where: {
                id: values.map(x => x.id)
            },
            order,
            paranoid: options.paranoid
        }, filter.data ?? {});
    }

    private async getAccessControlWhereCondition(where: WhereOptions, user: DataFilterUserModel): Promise<WhereOptions> {
        if (!user) {
            throw new Error("No user found");
        } else if (!this.accessControlAdapter) {
            throw new Error("AccessControl isn't enable in your project");
        }

        const ids = await this.accessControlAdapter.getResourceIds(this.repository.model, user);
        return SequelizeUtils.mergeWhere({ id: ids }, where ?? {});
    }

    private getFilterLookups(model: Model<any>, filter: FilterDefinition): any[][] {
        if (!filter.path) {
            return [];
        }

        return [
            this.mongoSchemaScanner.getLookups(model.schema, filter.path)
        ];
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
