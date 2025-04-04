import { Injectable, Type } from "@nestjs/common";
import {
    CountOptions,
    FindOptions,
    GroupedCountResultItem,
    Includeable,
    IncludeOptions,
    literal,
    Op,
    Order,
    OrderItem,
    WhereOptions
} from "sequelize";
import { GroupOption, ProjectionAlias } from "sequelize/types/model";
import { ExportTypes, FilterQueryModel, FilterResultModel, FilterSearchModel, OrderModel } from "../";
import { AccessControlAdapter } from "../adapters/access-control.adapter";
import { TranslateAdapter } from "../adapters/translate.adapter";
import { DataFilterRepository } from "../data-filter.repository";
import { DataFilterService } from "../data-filter.service";
import { DataFilterUserModel } from "../models/user.model";
import { SequelizeModelScanner } from "../scanners/sequelize-model.scanner";
import { M, SequelizeUtils } from "../sequelize.utils";
import { BaseFilter } from "./base-filter";
import { FilterUtils } from "./filter.utils";
import {
    Filter,
    FilterCondition,
    FilterConditionRule,
    FilterDefinition,
    SelectFilter,
    SelectFilterValue
} from "./filters";
import { GeoLocalizationFilter } from "./filters/geo-localization.filter";
import { GroupFilter, GroupFilterDefinition } from "./filters/group.filter";
import { QueryModel, QueryRuleModel } from "./models";
import { FilterConfigurationSearchModel } from "./models/filter-configuration-search.model";
import { FilterConfigurationModel } from "./models/filter-configuration.model";
import { FilterResourceValueModel } from "./models/filter-resource-value.model";
import { OrderRule, OrderRuleContext, OrderRuleDefinition } from "./order-rules/order-rule";

interface CountParams<Users extends DataFilterUserModel> {
    options: FilterQueryModel;
    user?: Users | null;
}

interface CountTotalValuesParams<Users extends DataFilterUserModel> {
    options: FindOptions;
    user?: Users | null;
}

interface DownloadDataParams<Users extends DataFilterUserModel, Request> {
    exportOptions?: object;
    options: FilterQueryModel;
    request: Request;
    type: ExportTypes;
    user: Users | null;
}

interface FilterParams<Users extends DataFilterUserModel, Request> {
    options: FilterQueryModel;
    request: Request;
    user?: Users | null;
}

interface FindValuesParams<Users extends DataFilterUserModel, Request, Data> {
    filter: FilterQueryModel;
    options: FindOptions;
    repository?: DataFilterRepository<Data>;
    request: Request;
    user?: Users | null;
}

@Injectable()
export class FilterService<Data> {
    private definitions!: { [name: string]: FilterDefinition | GroupFilterDefinition | OrderRuleDefinition };
    private repository!: DataFilterRepository<Data>;
    private exportRepository!: DataFilterRepository<Data>;

    constructor(
        private accessControlAdapter: AccessControlAdapter,
        private translateAdapter: TranslateAdapter,
        private model: BaseFilter<Data>,
        private sequelizeModelScanner: SequelizeModelScanner,
        private dataFilter: DataFilterService,
        private options?: { disableAccessControl?: boolean }
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
            } as unknown as BaseFilter<T>,
            this.sequelizeModelScanner,
            this.dataFilter,
            this.options
        );
    }

    public async getConfig(request: any, user?: DataFilterUserModel): Promise<FilterConfigurationModel[]> {
        const result: FilterConfigurationModel[] = [];
        for (const key in this.definitions) {
            if (!this.definitions.hasOwnProperty(key) || OrderRule.validate(this.definitions[key])) {
                continue;
            }

            const config = await (this.definitions[key] as FilterDefinition).getConfig(key, request, user);
            if (!config) {
                continue;
            }
            result.push({
                ...config,
                id: key,
                name: await this.translateAdapter.getTranslation(user?.language ?? "fr", FilterUtils.getFilterTranslationKey(key))
            });
        }

        return result;
    }

    public async searchConfigValues(
        request: any,
        search: FilterConfigurationSearchModel,
        user?: DataFilterUserModel
    ): Promise<SelectFilterValue[]> {
        if (!this.definitions.hasOwnProperty(search.id)) {
            return [];
        }

        const filter = this.definitions[search.id];
        if (filter instanceof SelectFilter) {
            return await filter.values({
                value: search.value,
                user,
                request,
                page: this.convertNumber(search.page),
                pageSize: this.convertNumber(search.pageSize),
            });
        }

        return [];
    }

    private convertNumber(value?: string | number): number | null {
        if (!value) {
            return null;
        }

        const parsedNumber = Number(value);
        return isNaN(parsedNumber) ? null : parsedNumber;
    }

    public async findResourceValueById(request: any, search: FilterResourceValueModel, user?: DataFilterUserModel): Promise<SelectFilterValue | null> {
        if (!this.definitions.hasOwnProperty(search.id)) {
            return null;
        }

        const filter = this.definitions[search.id];
        if (filter instanceof SelectFilter && filter.getResourceById) {
            return await filter.getResourceById({ id: search.resourceId, user, request });
        }

        return null;
    }

    public async count<Users extends DataFilterUserModel>(params: CountParams<Users> ): Promise<number> {
        const { options } = params;
        const user = params.user ?? null;

        const countOptions = await this.getFindOptions(this.repository.model, options.query);
        if (options.search) {
            this.addSearchCondition(options.search, countOptions, user?.language ?? null);
        }

        return this.countTotalValues( { options: countOptions, user });
    }

    public async filter<Request, Users extends DataFilterUserModel>(params: FilterParams<DataFilterUserModel, Request>): Promise<FilterResultModel<Data>> {
        const { options, request } = params;
        const user = params.user ?? null;

        if (options.order) {
            options.order = this.normalizeOrder(options.order);
        }

        const countOptions = await this.getFindOptions(this.repository.model, options.query, options.data);
        if (options.search) {
            this.addSearchCondition(options.search, countOptions, user?.language ?? null);
        }
        if (options.order) {
            this.addOrderCondition(options.order, countOptions, options.data);
        }
        this.addGroupOption(options, countOptions);

        const total = await this.countTotalValues({ options: countOptions, user });
        const values = await this.findValues({ filter: options, options: countOptions, request, user });

        return {
            total,
            page: options.page,
            values
        };
    }

    public async downloadData<Request>(params: DownloadDataParams<DataFilterUserModel, Request>): Promise<Buffer | string> {
        const { exportOptions, options, request, type, user } = params;

        const findOptions = await this.getFindOptions(this.exportRepository.model, options.query);

        if (options.order) {
            options.order = this.normalizeOrder(options.order);
        }

        if (options.search) {
            this.addSearchCondition(options.search, findOptions, user?.language ?? null);
        }
        if (options.order) {
            this.addOrderCondition(options.order, findOptions, options.data);
        }
        delete options.page;

        const values = await this.findValues({ filter: options, options: findOptions, repository: this.exportRepository, request, user });

        const headers = await this.model.getExportedFieldsKeys(type);
        if (headers.length) {
            const data = await Promise.all(values.map((value) => this.model.getExportedFields(value, user?.language ?? "fr", type)));
            return await this.repository.downloadData(headers, data, type, user?.language ?? "fr", exportOptions);
        } else {
            return await this.repository.downloadData(values, type, user?.language ?? "fr", exportOptions);
        }
    }

    public async getFindOptions(model: typeof M, query: QueryModel | undefined, data?: object): Promise<FindOptions> {
        /**
         * Reset Geo localization filter state
         */
        GeoLocalizationFilter.reset();

        query = this.addDefaultFilter(query);
        let option: FindOptions = {};
        if (query) {
            const whereConditions: any[] = [];
            const havingConditions: any[] = [];

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
        this.exportRepository = this.dataFilter.for(this.model.exportDataDefinition ?? this.model.dataDefinition);
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
                includes.push(...this.getFilterInclude(model, f.rootFilter, r, data));

                if (!f.lazyLoading) {
                    if (f.valueFilter) {
                        includes.push(...this.getFilterInclude(model, f.valueFilter, r, data));
                    }
                } else if (f.getValueFilter && Array.isArray(r.value)) {
                    const valueFiler = await f.getValueFilter(r.value[0]);
                    includes.push(...this.getFilterInclude(model, valueFiler as FilterDefinition, r, data));
                }
            } else {
                includes.push(...this.getFilterInclude(model, filter as FilterDefinition, r, data));
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
            return true;
        }

        let paranoid = true;
        for (const rule of query.rules) {
            const c = rule as QueryModel;
            if (c.condition) {
                const conditions: any[] = [];
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

    private async generateHavingOptions(query: QueryModel, options: WhereOptions[]): Promise<void> {
        if (!query.rules) {
            return;
        }

        for (const rule of query.rules) {
            const c = rule as QueryModel;
            if (c.condition) {
                const conditions: any[] = [];
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

    private addSearchCondition(search: FilterSearchModel, options: CountOptions, language: string | null): void {
        const value = search?.value?.toString();
        if (!value?.length) {
            return;
        }

        this.repository.addSearchCondition(search.value, options, language);
    }

    private addOrderCondition(orders: OrderModel[], options: CountOptions, data?: object): void {
        if (orders.every(order => !order.direction)) {
            return;
        }

        if (this.model.defaultOrderRule) {
            const defaultOrders = Array.isArray(this.model.defaultOrderRule.order)
                ? this.model.defaultOrderRule.order
                : [this.model.defaultOrderRule.order];

            orders = [...defaultOrders, ...orders];
        }

        for (const order of orders) {
            const rule = this.definitions[order.column] as OrderRuleDefinition;
            const includes = rule && OrderRule.validate(rule) ?
                rule.path ? this.sequelizeModelScanner.getIncludes(this.repository.model, { path: rule.path }, []) : [] :
                this.repository.generateOrderInclude(order, data);

            if (!includes.length) {
                continue;
            }

            options.include = SequelizeUtils.mergeIncludes(
                options.include as IncludeOptions | IncludeOptions[],
                includes
            );
        }
    }

    private addGroupOption(filter: FilterQueryModel, options: CountOptions): void {
        const model = this.repository.model;
        options.group = [`${model.name}.id`];
        if (filter.groupBy) {
            options.group.push(SequelizeUtils.getGroupLiteral(this.repository.model, filter.groupBy));
        }

        if (!filter.order || (filter.order instanceof Array && !filter.order.length)) {
            return;
        }

        const orders = this.normalizeOrder(filter.order);
        for (const order of orders) {
            const rule = this.definitions[order.column] as OrderRuleDefinition;
            if (rule && OrderRule.validate(rule)) {
                continue;
            }

            if (this.repository.hasCustomAttribute(order.column)) {
                continue;
            }

            const values = order.column.split(".");
            const column = values.pop() as string;
            if (!values.length) {
                options.group.push(`${model.name}.${SequelizeUtils.findColumnFieldName(model, column)}`);
            } else {
                options.group.push(...this.sequelizeModelScanner.getGroup(model, order));
            }
        }
    }

    private async countTotalValues<Users extends DataFilterUserModel>(params: CountTotalValuesParams<Users>): Promise<number> {
        const { options } = params;
        const user = params.user ?? null;

        if (user) {
            options.where = await this.getAccessControlWhereCondition(options.where, user);
        }

        if (options.having) {
            const data = await this.repository.model.findAll({
                ...options,
                subQuery: false
            });
            return data.length;
        } else {
            const { group, ...countOptions } = options;
            const value = await this.repository.model.count({
                ...countOptions,
                distinct: true
            }) as number | GroupedCountResultItem[];
            if (typeof value === "number") {
                return value;
            } else {
                return value.length;
            }
        }
    }

    private async findValues<Users extends DataFilterUserModel, Request>(params: FindValuesParams<Users, Request, Data>): Promise<Data[]> {
        const { filter, options, request } = params;
        const user = params.user ?? null;
        const repository = params.repository ?? this.repository;

        if (user) {
            options.where = await this.getAccessControlWhereCondition(options.where, user);
        }

        const order = this.getOrderOptions(filter.order ?? [], { request, user });
        const nonNestedOrderColumns = (Array.isArray(filter.order) ? filter.order : [filter.order])
            .filter((order): order is OrderModel => !!order)
            .map(order => {
                const rule = this.definitions[order.column] as OrderRuleDefinition;
                if (!rule || !OrderRule.validate(rule)) {
                    return order.column;
                } else {
                    return [rule.path ?? "", rule.attribute].join(".");
                }
            })
            .filter(column => column && !column.includes(".") && !repository.hasCustomAttribute(column));
        const customAttributes = filter.order ? this.getOrderCustomAttribute(filter.order, filter.data) : [];

        const values = await repository.model.findAll({
            ...options,
            attributes: ["id", ...nonNestedOrderColumns, ...customAttributes],
            limit: filter.page?.size,
            offset: filter.page ? filter.page.number * filter.page.size + (filter.page.offset ?? 0) : undefined,
            subQuery: false,
            group: filter.groupBy ?? options.group,
            order
        });

        const group = this.generateRepositoryGroupBy(filter);
        return await repository.findAll({
            where: {
                id: values.map(x => x.id)
            },
            order,
            paranoid: options.paranoid,
            group
        }, filter.data ?? {});
    }

    private async getAccessControlWhereCondition(where: WhereOptions | undefined, user: DataFilterUserModel): Promise<WhereOptions | undefined> {
        if (this.options?.disableAccessControl) {
            return where;
        }

        if (!user) {
            throw new Error("No user found");
        } else if (!this.accessControlAdapter) {
            throw new Error("AccessControl isn't enable in your project");
        }

        const resources = await this.accessControlAdapter.getResources(this.repository.model, user);
        if (resources.ids) {
            return SequelizeUtils.mergeWhere({ id: resources.ids }, where ?? {});
        }
        if (resources.where) {
            return {
                [Op.and]: [
                    resources.where,
                    where ?? {}
                ]
            };
        }

        return where;
    }

    private getFilterInclude(
        model: typeof M,
        filter: FilterDefinition,
        rule: QueryRuleModel,
        data?: object
    ): IncludeOptions[][] {
        const includes: IncludeOptions[][] = [];
        const paths = filter.getIncludePaths(rule, data);
        for (const path of paths) {
            includes.push(
                this.sequelizeModelScanner.getIncludes(model, path, [], [], true)
            );
        }

        if (!filter.path) {
            if (filter.condition) {
                includes.push(this.getConditionInclude(model, filter.condition));
            }

            return includes;
        }

        return [
            ...includes,
            this.sequelizeModelScanner.getIncludes(model, {
                path: filter.path,
                paranoid: filter.paranoid,
                where: filter.where ? FilterUtils.generateWhereConditions(filter.where, data) : undefined
            }, [], [], true),
            filter.condition ? this.getConditionInclude(model, filter.condition): []
        ];
    }

    private getOrderOptions(orders: OrderModel | OrderModel[], context: OrderRuleContext): Order {
        let orderColumns = Array.isArray(orders) ? orders : [orders];

        if (this.model.defaultOrderRule) {
            const defaultOrders = Array.isArray(this.model.defaultOrderRule.order)
                ? this.model.defaultOrderRule.order
                : [this.model.defaultOrderRule.order];

            const applicableDefaultOrderRule = defaultOrders.filter((order) => !orderColumns.some((o) => o.column === order.column));

            orderColumns = [...applicableDefaultOrderRule, ...orderColumns];
        }

        const generatedOrder: Order = [];

        for (const order of orderColumns) {
            if (!order?.column || !order.direction) {
                continue;
            }

            if (this.repository.hasCustomAttribute(order.column)) {
                const column = order.nullLast ? `-${order.column}` : order.column;
                const direction = order.nullLast ? order.direction === "asc" ? "desc" : "asc" : order.direction;
                generatedOrder.push([literal(column), direction.toUpperCase()]);
                continue;
            }

            const rule = this.definitions[order.column] as OrderRuleDefinition;
            if (!rule || !OrderRule.validate(rule)) {
                generatedOrder.push(this.sequelizeModelScanner.getOrder(this.repository.model, order) as OrderItem);
            } else {
                generatedOrder.push([rule.getOrderOption(this.repository.model, context), order.direction.toUpperCase()]);
            }
        }

        return generatedOrder;
    }

    private getOrderCustomAttribute(orders: OrderModel | OrderModel[], data?: object): ProjectionAlias[] {
        if (!Array.isArray(orders)) {
            orders = [orders];
        }

        const attributes: ProjectionAlias[] = [];
        for (const order of orders) {
            if (!this.repository.hasCustomAttribute(order.column)) {
                continue;
            }

            const customAttribute = this.repository.getCustomAttribute(order.column);
            const attribute = customAttribute?.transform(data) as ProjectionAlias;
            if (attribute) {
                attributes.push(attribute);
            }
        }
        return attributes;
    }

    private generateRepositoryGroupBy(filter: FilterQueryModel): GroupOption | undefined {
        const group: GroupOption = [];
        if (filter.groupBy) {
            group.push(SequelizeUtils.getGroupLiteral(this.repository.model, filter.groupBy));
        }

        const groupBy = this.repository.getCustomAttributeGroupBy();
        if (!groupBy.length) {
            return group;
        }

        group.push(...groupBy);
        if (!filter.order || (filter.order instanceof Array && !filter.order.length)) {
            return group;
        }

        const orders = this.normalizeOrder(filter.order);
        for (const order of orders) {
            if (!order?.column || !order.direction) {
                continue;
            }

            if (this.repository.hasCustomAttribute(order.column)) {
                continue;
            }

            const rule = this.definitions[order.column] as OrderRuleDefinition;
            if (!rule || !OrderRule.validate(rule)) {
                group.push(`${this.repository.model.name}.${SequelizeUtils.findColumnFieldName(this.repository.model, order.column)}`);
            } else {
                group.push(...this.sequelizeModelScanner.getGroup(this.repository.model, order));
            }
        }

        return group;
    }

    private addDefaultFilter(query?: QueryModel): QueryModel | undefined {
        if (!this.model.defaultFilter) {
            return query;
        }

        if (this.model.defaultFilter.required) {
            if (query?.condition !== "and") {
                query = {
                    condition: "and",
                    rules: query ? [query] : []
                };
            }
        } else {
            if (query?.condition !== "or") {
                query = {
                    condition: "or",
                    rules: query ? [query] : []
                };
            }
        }
        query?.rules.push(this.model.defaultFilter.filter);
        return query;
    }

    private normalizeOrder(orders: OrderModel | OrderModel[]): OrderModel[] {
        if (!Array.isArray(orders)) {
            orders = [orders];
        }

        orders = orders?.filter(order => order?.column);

        if (!orders?.length) {
            orders = [{
                column: "id",
                direction: "asc"
            }];
        }

        return orders;
    }

    private getNonNestedOrderColumns(orders: OrderModel[]): string[] {
        return orders.filter(order => order.column && !order.column.includes(".")).map(order => order.column);
    }
}
