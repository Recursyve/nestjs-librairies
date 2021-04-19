import { Injectable, Type } from "@nestjs/common";
import { col, CountOptions, FindOptions, Includeable, IncludeOptions, Op, Order, WhereOptions } from "sequelize";
import { ExportTypes, FilterQueryModel, FilterResultModel, FilterSearchModel, OrderModel } from "../";
import { AccessControlAdapter } from "../adapters/access-control.adapter";
import { TranslateAdapter } from "../adapters/translate.adapter";
import { DataFilterRepository } from "../data-filter.repository";
import { DataFilterService } from "../data-filter.service";
import { IncludeWhereModel } from "../models/include.model";
import { DataFilterUserModel } from "../models/user.model";
import { SequelizeModelScanner } from "../scanners/sequelize-model.scanner";
import { M, SequelizeUtils } from "../sequelize.utils";
import { BaseFilter } from "./base-filter";
import { FilterUtils } from "./filter.utils";
import {
    Filter, FilterCondition, FilterConditionRule, FilterDefinition, SelectFilter, SelectFilterValue
} from "./filters";
import { GeoLocalizationFilter } from "./filters/geo-localization.filter";
import { GroupFilter, GroupFilterDefinition } from "./filters/group.filter";
import { QueryModel, QueryRuleModel } from "./models";
import { FilterConfigurationSearchModel } from "./models/filter-configuration-search.model";
import { FilterConfigurationModel } from "./models/filter-configuration.model";
import { FilterResourceValueModel } from "./models/filter-resource-value.model";
import { OrderRule, OrderRuleDefinition } from "./order-rules/order-rule";

@Injectable()
export class FilterService<Data> {
    private definitions: { [name: string]: FilterDefinition | GroupFilterDefinition | OrderRuleDefinition };
    private repository: DataFilterRepository<Data>;

    constructor(
        private accessControlAdapter: AccessControlAdapter,
        private translateAdapter: TranslateAdapter,
        private model: BaseFilter<Data>,
        private sequelizeModelScanner: SequelizeModelScanner,
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
            this.sequelizeModelScanner,
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
            if (!config) {
                continue;
            }
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
        if (!options.order || !options.order.column) {
            options.order = {
                column: "id",
                direction: "asc"
            };
        }

        const countOptions = await this.getFindOptions(this.repository.model, options.query, options.data);
        this.addSearchCondition(options.search, countOptions);
        this.addOrderCondition(options.order, countOptions);
        this.addGroupOption(options, countOptions);

        const total = await (user ? this.countTotalValues(user, countOptions) : this.countTotalValues(countOptions));
        const values = await (user ? this.findValues(user, options, countOptions) : this.findValues(options, countOptions));
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
        const findOptions = await this.getFindOptions(this.repository.model, options.query);
        this.addSearchCondition(options.search, findOptions);
        this.addOrderCondition(options.order, findOptions);
        delete options.page;
        const values = await this.findValues(user, options, findOptions);
        return await this.repository.downloadData(values, type, user.language, exportOptions);
    }

    public async getFindOptions(model: typeof M, query: QueryModel, data?: object): Promise<FindOptions> {
        /**
         * Reset Geo localization filter state
         */
        GeoLocalizationFilter.reset();

        query = this.addDefaultFilter(query);
        let option: FindOptions = {};
        if (query) {
            const whereConditions = [];
            const havingConditions = [];

            option = {
                ...option,
                include: await this.getInclude(model, query, data),
                where: query.condition === "and" ? { [Op.and]: whereConditions } : { [Op.or]: whereConditions },
                having: query.condition === "and" ? { [Op.and]: havingConditions } : { [Op.or]: havingConditions }
            };

            const paranoid = await this.generateWhereOptions(query, whereConditions);
            await this.generateHavingOptions(query, havingConditions);

            if (!paranoid) {
                option.paranoid = paranoid;
            }

            if (!havingConditions.length) {
                delete option.having;
            }
        }

        return option;
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
                !OrderRule.validate(this.model[key] as OrderRuleDefinition)
            ) {
                continue;
            }

            this.definitions[key] = this.model[key] as FilterDefinition;
        }
    }

    private async getInclude(model: typeof M, query: QueryModel, data?: object): Promise<Includeable[]> {
        if (!query.rules) {
            return [];
        }

        const includes: IncludeOptions[][] = [];
        for (const rule of query.rules) {
            const m = rule as QueryModel;
            if (m.condition) {
                includes.push(await this.getInclude(model, m, data) as IncludeOptions[]);
                continue;
            }

            const r = rule as QueryRuleModel;
            if (!this.definitions.hasOwnProperty(r.id)) {
                continue;
            }

            const filter = this.definitions[r.id];
            if ((filter as GroupFilterDefinition).rootFilter) {
                const f = filter as GroupFilterDefinition;
                includes.push(...this.getFilterInclude(model, f.rootFilter, data));

                if (!f.lazyLoading) {
                    includes.push(...this.getFilterInclude(model, f.valueFilter, data));
                } else {
                    const valueFiler = await f.getValueFilter(r.value[0]);
                    includes.push(...this.getFilterInclude(model, valueFiler as FilterDefinition, data))
                }
            } else {
                includes.push(...this.getFilterInclude(model, filter as FilterDefinition, data));
            }
        }
        return SequelizeUtils.reduceIncludes(includes, true);
    }

    private getConditionInclude(model: typeof M, condition: FilterCondition): IncludeOptions[] {
        if (!condition) {
            return [];
        }

        const includes: IncludeOptions[] = [];
        for (const rule of condition.rules) {
            const c = rule as FilterCondition;
            if (c.condition) {
                includes.push(...this.getConditionInclude(model, condition));
            }
            const r = rule as FilterConditionRule;
            if (r.path) {
                includes.push(...this.sequelizeModelScanner.getIncludes(model, { path: r.path }, [], { include: [] }, true));
            }
        }
        return includes;
    }

    private async generateWhereOptions(query: QueryModel, options: WhereOptions[]): Promise<boolean> {
        if (!query.rules) {
            return;
        }

        let paranoid = true;
        for (const rule of query.rules) {
            const c = rule as QueryModel;
            if (c.condition) {
                const conditions = [];
                const op = c.condition === "and" ? Op.and : Op.or;
                const where = { [op]: conditions };
                paranoid = paranoid && await this.generateWhereOptions(c, conditions);

                if (where[op as any].length) {
                    options.push(where);
                }

                continue;
            }

            const r = rule as QueryRuleModel;
            if (!this.definitions.hasOwnProperty(r.id)) {
                continue;
            }

            const filter = this.definitions[r.id] as FilterDefinition;
            if (!OrderRule.validate(filter)) {
                const filterOptions = await filter.getWhereOptions(r);

                if (filterOptions) {
                    options.push(filterOptions);
                }
            }
            paranoid = filter.paranoid ?? true;
        }

        return paranoid;
    }

    private async generateHavingOptions(query: QueryModel, options: WhereOptions[]) {
        if (!query.rules) {
            return;
        }

        for (const rule of query.rules) {
            const c = rule as QueryModel;
            if (c.condition) {
                const conditions = [];
                const op = c.condition === "and" ? Op.and : Op.or;
                const having = { [op]: conditions };
                await this.generateHavingOptions(c, conditions);

                if (having[op as any].length) {
                    options.push(having);
                }

                continue;
            }

            const r = rule as QueryRuleModel;
            if (!this.definitions.hasOwnProperty(r.id)) {
                continue;
            }

            const filter = this.definitions[r.id] as FilterDefinition;
            if (!OrderRule.validate(filter)) {
                const filterOptions = await filter.getHavingOptions(r);
                if (filterOptions) {
                    options.push(filterOptions);
                }
            }
        }
    }

    private addSearchCondition(search: FilterSearchModel, options: CountOptions): void {
        const value = search?.value?.toString();
        if (!value?.length) {
            return;
        }

        this.repository.addSearchCondition(search.value, options);
    }

    private addOrderCondition(order: OrderModel, options: CountOptions): void {
        if (!order || order.direction === "") {
            return;
        }

        const rule = this.definitions[order.column] as OrderRuleDefinition;
        const includes = rule && OrderRule.validate(rule) ?
            this.sequelizeModelScanner.getIncludes(this.repository.model, { path: rule.path }, []) :
            this.repository.generateOrderInclude(order);
        if (!includes.length) {
            return;
        }

        options.include = SequelizeUtils.mergeIncludes(
            options.include as IncludeOptions[],
            includes as IncludeOptions[]
        );
    }

    private addGroupOption(query: FilterQueryModel, options: CountOptions): void {
        if (query?.order?.column === "") {
            return;
        }

        const rule = this.definitions[query.order.column] as OrderRuleDefinition;
        if (rule && OrderRule.validate(rule)) {
            return;
        }

        const model = this.repository.model;
        const values = query?.order?.column.split(".");
        const column = values.pop();
        if (!values.length) {
            options.group = [`${model.name}.id`, `${model.name}.${SequelizeUtils.findColumnFieldName(model, column)}`];
        } else {
            options.group = [`${model.name}.id`, ...this.sequelizeModelScanner.getGroup(model, query.order)];
        }
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
        const orderAttr = order[0]?.length === 2 ? order[0][order[0].length - 2] : undefined
        const values = await this.repository.model.findAll({
            ...options,
            attributes: orderAttr && orderAttr?.constructor?.name !== "Literal" ? ["id", orderAttr] : ["id"],
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

    private generateWhereConditions(model: IncludeWhereModel, data?: object): WhereOptions {
        if (!model) {
            return;
        }

        const where = {};
        for (const key in model) {
            if (!model.hasOwnProperty(key)) {
                continue;
            }

            const value = model[key](data);
            if (typeof value !== "undefined") {
                where[key] = value;
            }
        }

        return where;
    }

    private getFilterInclude(model: typeof M, filter: FilterDefinition, data?: object): IncludeOptions[][] {
        if (!filter.path) {
            return [this.getConditionInclude(model, filter.condition)];
        }

        return [
            this.sequelizeModelScanner.getIncludes(model, {
                path: filter.path,
                where: this.generateWhereConditions(filter.where, data)
            }, [], [], true),
            this.getConditionInclude(model, filter.condition)
        ];
    }

    private getOrderOptions(orderObj: OrderModel): Order {
        if (!orderObj || !orderObj.column || orderObj.direction === "") {
            return;
        }

        const rule = this.definitions[orderObj.column] as OrderRuleDefinition;
        if (!rule || !OrderRule.validate(rule)) {
            return this.sequelizeModelScanner.getOrder(this.repository.model, orderObj);
        }

        return [[rule.getOrderOption(), orderObj.direction.toUpperCase()]];
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
