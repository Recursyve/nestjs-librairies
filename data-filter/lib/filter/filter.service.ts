import { Injectable, Optional, Type } from "@nestjs/common";
import { AccessControlService, Users } from "@recursyve/nestjs-access-control";
import { BaseFilter } from "./base-filter";
import { QueryModel, QueryRuleModel } from "./models";
import { FilterConfigurationModel } from "./models/filter-configuration.model";
import {
    Filter,
    FilterCondition,
    FilterConditionRule,
    FilterDefinition,
    SelectFilter,
    SelectFilterValue
} from "./filters";
import {
    CountOptions,
    FindAttributeOptions,
    FindOptions,
    Includeable,
    IncludeOptions,
    Op,
    WhereOptions
} from "sequelize";
import { SequelizeModelScanner } from "../scanners/sequelize-model.scanner";
import { M, SequelizeUtils } from "../sequelize.utils";
import { DataFilterService } from "../data-filter.service";
import { FilterQueryModel, FilterResultModel, FilterSearchModel, OrderModel } from "../";
import { DataFilterRepository } from "../data-filter.repository";
import { FilterConfigurationSearchModel } from "./models/filter-configuration-search.model";
import { FilterResourceValueModel } from "./models/filter-resource-value.model";
import { IncludeWhereModel } from "../models/include.model";
import { GeoLocalizationFilter } from "./filters/geo-localization.filter";
import { GroupFilter, GroupFilterDefinition } from "./filters/group.filter";

@Injectable()
export class FilterService<Data> {
    private filters: { [name: string]: FilterDefinition | GroupFilterDefinition };
    private repository: DataFilterRepository<Data>;

    constructor(
        @Optional() private accessControlService: AccessControlService,
        private model: BaseFilter<Data>,
        private sequelizeModelScanner: SequelizeModelScanner,
        private dataFilter: DataFilterService
    ) {
        this.init();
    }

    public forData<T>(dataDef: Type<T>): FilterService<T> {
        return new FilterService(
            this.accessControlService,
            {
                ...this.model,
                dataDefinition: dataDef
            } as BaseFilter<T>,
            this.sequelizeModelScanner,
            this.dataFilter
        );
    }

    public async getConfig(user?: Users): Promise<FilterConfigurationModel[]> {
        const result: FilterConfigurationModel[] = [];
        for (const key in this.filters) {
            if (!this.filters.hasOwnProperty(key)) {
                continue;
            }

            const config = await (this.filters[key] as FilterDefinition).getConfig(key);
            result.push({
                ...config,
                id: key,
                name: key
            });
        }

        return result;
    }

    public async searchConfigValues(
        search: FilterConfigurationSearchModel,
        user?: Users
    ): Promise<SelectFilterValue[]> {
        if (!this.filters.hasOwnProperty(search.id)) {
            return [];
        }

        const filter = this.filters[search.id];
        if (filter instanceof SelectFilter) {
            return await filter.values(search.value, user);
        }

        return [];
    }

    public async findResourceValueById(search: FilterResourceValueModel, user?: Users): Promise<SelectFilterValue> {
        if (!this.filters.hasOwnProperty(search.id)) {
            return;
        }

        const filter = this.filters[search.id];
        if (filter instanceof SelectFilter && filter.getResourceById) {
            return await filter.getResourceById(search.resourceId, user);
        }

        return;
    }

    public async count(user: Users, options: FilterQueryModel): Promise<number>;
    public async count(options: FilterQueryModel): Promise<number>;
    public async count(...args: [Users | FilterQueryModel, FilterQueryModel?]): Promise<number> {
        const [userOrOpt, opt] = args;
        const options = opt ? opt : userOrOpt as FilterQueryModel;
        const user = opt ? userOrOpt as Users : null;

        const countOptions = await this.getFindOptions(this.repository.model, options.query);
        this.addSearchCondition(options.search, countOptions);
        return user ? this.countTotalValues(user, countOptions) : this.countTotalValues(countOptions);
    }

    public async filter(user: Users, options: FilterQueryModel): Promise<FilterResultModel<Data>>;
    public async filter(options: FilterQueryModel): Promise<FilterResultModel<Data>>;
    public async filter(...args: [Users | FilterQueryModel, FilterQueryModel?]): Promise<FilterResultModel<Data>> {
        const [userOrOpt, opt] = args;
        const options = opt ? opt : userOrOpt as FilterQueryModel;
        const user = opt ? userOrOpt as Users : null;

        const countOptions = await this.getFindOptions(this.repository.model, options.query);
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

    public async getFindOptions(model: typeof M, query: QueryModel): Promise<FindOptions> {
        /**
         * Reset Geo localization filter state
         */
        GeoLocalizationFilter.reset();

        let option: FindOptions = {
            group: `${model.name}.id`
        };
        if (query) {
            const whereConditions = [];
            const havingConditions = [];

            option = {
                ...option,
                include: await this.getInclude(model, query),
                where: query.condition === "and" ? { [Op.and]: whereConditions } : { [Op.or]: whereConditions },
                having: query.condition === "and" ? { [Op.and]: havingConditions } : { [Op.or]: havingConditions }
            };

            await this.generateWhereOptions(query, whereConditions);
            await this.generateHavingOptions(query, havingConditions);

            if (!havingConditions.length) {
                delete option.having;
            }
        }

        return option;
    }

    private init() {
        this.repository = this.dataFilter.for(this.model.dataDefinition);

        this.filters = {};
        for (const key in this.model) {
            if (!this.model.hasOwnProperty(key)) {
                continue;
            }

            if (!Filter.validate(this.model[key] as FilterDefinition) && !GroupFilter.validate(this.model[key] as GroupFilterDefinition)) {
                continue;
            }

            this.filters[key] = this.model[key] as FilterDefinition;
        }
    }

    private async getInclude(model: typeof M, query: QueryModel): Promise<Includeable[]> {
        if (!query.rules) {
            return [];
        }

        const includes: IncludeOptions[][] = [];
        for (const rule of query.rules) {
            const m = rule as QueryModel;
            if (m.condition) {
                includes.push(await this.getInclude(model, m) as IncludeOptions[]);
                continue;
            }

            const r = rule as QueryRuleModel;
            if (!this.filters.hasOwnProperty(r.id)) {
                continue;
            }

            const filter = this.filters[r.id];
            if ((filter as GroupFilterDefinition).rootFilter) {
                const f = filter as GroupFilterDefinition;
                includes.push(...this.getFilterInclude(model, f.rootFilter));

                if (!f.lazyLoading) {
                    includes.push(...this.getFilterInclude(model, f.valueFilter));
                } else {
                    const valueFiler = await f.getValueFilter(r.value[0]);
                    includes.push(...this.getFilterInclude(model, valueFiler as FilterDefinition))
                }
            } else {
                includes.push(...this.getFilterInclude(model, filter as FilterDefinition));
            }
        }
        return SequelizeUtils.reduceIncludes(includes);
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
                includes.push(...this.sequelizeModelScanner.getIncludes(model, { path: r.path }, [], { include: [] }));
            }
        }
        return includes;
    }

    private async generateWhereOptions(query: QueryModel, options: WhereOptions[]) {
        if (!query.rules) {
            return;
        }

        for (const rule of query.rules) {
            const c = rule as QueryModel;
            if (c.condition) {
                const conditions = [];
                const op = c.condition === "and" ? Op.and : Op.or;
                const where = { [op]: conditions };
                await this.generateWhereOptions(c, conditions);

                if (where[op as any].length) {
                    options.push(where);
                }

                continue;
            }

            const r = rule as QueryRuleModel;
            if (!this.filters.hasOwnProperty(r.id)) {
                continue;
            }

            const filter = this.filters[r.id];
            const filterOptions = await filter.getWhereOptions(r);
            if (filterOptions) {
                options.push(filterOptions);
            }
        }
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
            if (!this.filters.hasOwnProperty(r.id)) {
                continue;
            }

            const filter = this.filters[r.id];
            const filterOptions = await filter.getHavingOptions(r);
            if (filterOptions) {
                options.push(filterOptions);
            }
        }
    }

    private addSearchCondition(search: FilterSearchModel, options: CountOptions): void {
        if (!search || !search.value || !search.value.length) {
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

    private addOrderCondition(order: OrderModel, options: CountOptions): void {
        if (!order || order.direction === "") {
            return;
        }

        const includes = this.repository.generateOrderInclude(order);
        if (!includes.length) {
            return;
        }

        options.include = SequelizeUtils.mergeIncludes(
            options.include as IncludeOptions[],
            includes as IncludeOptions[]
        );
    }

    private async countTotalValues(user: Users, options: FindOptions): Promise<number>;
    private async countTotalValues(options: FindOptions): Promise<number>;
    private async countTotalValues(...args: [Users | FindOptions, FindOptions?]): Promise<number> {
        const [userOrOpt, opt] = args;
        const options = opt ? opt : userOrOpt as FindOptions;

        /**
         * This means that countTotalValues was called with a user
         */
        if (opt) {
            options.where = await this.getAccessControlWhereCondition(options.where, userOrOpt as Users);
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
            });
            if (typeof value === "number") {
                return value;
            } else {
                return value.length;
            }
        }
    }

    private async findValues(user: Users, filter: FilterQueryModel, options: FindOptions): Promise<Data[]>;
    private async findValues(filter: FilterQueryModel, options: FindOptions): Promise<Data[]>;
    private async findValues(...args: [Users | FilterQueryModel, FilterQueryModel | FindOptions, FindOptions?]): Promise<Data[]> {
        const [userOrOFilter, filterOrOpt, opt] = args;
        const options = opt ? opt : filterOrOpt as FindOptions;
        const filter = opt ? filterOrOpt as FilterQueryModel : userOrOFilter as FilterQueryModel;

        /**
         * This means that findValues was called with a user
         */
        if (opt) {
            options.where = await this.getAccessControlWhereCondition(options.where, userOrOFilter as Users);
        }

        const order = this.sequelizeModelScanner.getOrder(this.repository.model, filter.order);
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
            order
        }, {});
    }

    private async getAccessControlWhereCondition(where: WhereOptions, user: Users): Promise<WhereOptions> {
        if (!user) {
            throw new Error("No user found");
        } else if (!this.accessControlService) {
            throw new Error("AccessControl isn't enable in your project");
        }

        const ids = await this.accessControlService.forModel(this.repository.model).getResourceIds(user);
        return SequelizeUtils.mergeWhere({ id: ids }, where ?? {});
    }

    private generateWhereConditions(model: IncludeWhereModel): WhereOptions {
        if (!model) {
            return;
        }

        const where = {};
        for (const key in model) {
            if (!model.hasOwnProperty(key)) {
                continue;
            }

            const value = model[key]();
            if (typeof value !== "undefined") {
                where[key] = value;
            }
        }

        return where;
    }

    private getFilterInclude(model: typeof M, filter: FilterDefinition): IncludeOptions[][] {
        if (!filter.path) {
            return [this.getConditionInclude(model, filter.condition)];
        }

        return [
            this.sequelizeModelScanner.getIncludes(model, {
                path: filter.path,
                where: this.generateWhereConditions(filter.where)
            }, []),
            this.getConditionInclude(model, filter.condition)
        ];
    }
}
