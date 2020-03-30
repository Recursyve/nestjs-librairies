import { Injectable, Type } from "@nestjs/common";
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
import { CountOptions, FindOptions, Includeable, IncludeOptions, Op, WhereOptions } from "sequelize";
import { SequelizeModelScanner } from "../scanners/sequelize-model.scanner";
import { M, SequelizeUtils } from "../sequelize.utils";
import { DataFilterService } from "../data-filter.service";
import { FilterQueryModel, FilterResultModel, FilterSearchModel, OrderModel } from "../";
import { DataFilterRepository } from "../data-filter.repository";
import { FilterConfigurationSearchModel } from "./models/filter-configuration-search.model";
import { FilterResourceValueModel } from "./models/filter-resource-value.model";
import { IncludeWhereModel } from "../models/include.model";

@Injectable()
export class FilterService<Data> {
    private filters: { [name: string]: FilterDefinition };
    private repository: DataFilterRepository<Data>;

    constructor(
        private model: BaseFilter<Data>,
        private sequelizeModelScanner: SequelizeModelScanner,
        private dataFilter: DataFilterService
    ) {
        this.init();
    }

    public forData<T>(dataDef: Type<T>): FilterService<T> {
        return new FilterService(
            {
                ...this.model,
                dataDefinition: dataDef
            } as BaseFilter<T>,
            this.sequelizeModelScanner,
            this.dataFilter
        );
    }

    public async getConfig(): Promise<FilterConfigurationModel[]> {
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
        search: FilterConfigurationSearchModel
    ): Promise<SelectFilterValue[]> {
        if (!this.filters.hasOwnProperty(search.id)) {
            return [];
        }

        const filter = this.filters[search.id];
        if (filter instanceof SelectFilter) {
            return await filter.values(search.value);
        }

        return [];
    }

    public async findResourceValueById(search: FilterResourceValueModel): Promise<SelectFilterValue> {
        if (!this.filters.hasOwnProperty(search.id)) {
            return;
        }

        const filter = this.filters[search.id];
        if (filter instanceof SelectFilter && filter.getResourceById) {
            return await filter.getResourceById(search.resourceId);
        }

        return;
    }

    public async count(options: FilterQueryModel): Promise<number> {
        const countOptions = this.getFindOptions(this.repository.model, options.query);
        this.addSearchCondition(options.search, countOptions);
        return await this.countTotalValues(countOptions);
    }

    public async filter(options: FilterQueryModel): Promise<FilterResultModel<Data>> {
        const countOptions = this.getFindOptions(this.repository.model, options.query);
        this.addSearchCondition(options.search, countOptions);
        this.addOrderCondition(options.order, countOptions);
        return {
            total: await this.countTotalValues(countOptions),
            page: options.page,
            values: await this.findValues(options, countOptions)
        };
    }

    public getFindOptions(model: typeof M, query: QueryModel): FindOptions {
        let option: FindOptions = {
            group: `${model.name}.id`
        };
        if (query) {
            const whereConditions = [];
            const havingConditions = [];

            option = {
                ...option,
                include: this.getInclude(model, query),
                where: query.condition === "and" ? { [Op.and]: whereConditions } : { [Op.or]: whereConditions },
                having: query.condition === "and" ? { [Op.and]: havingConditions } : { [Op.or]: havingConditions }
            };

            this.generateWhereOptions(query, whereConditions);
            this.generateHavingOptions(query, havingConditions);
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

            if (!Filter.validate(this.model[key] as FilterDefinition)) {
                continue;
            }

            this.filters[key] = this.model[key] as FilterDefinition;
        }
    }

    private getInclude(model: typeof M, query: QueryModel): Includeable[] {
        if (!query.rules) {
            return [];
        }

        const includes: IncludeOptions[][] = [];
        for (const rule of query.rules) {
            const m = rule as QueryModel;
            if (m.condition) {
                includes.push(this.getInclude(model, m) as IncludeOptions[]);
                continue;
            }

            const r = rule as QueryRuleModel;
            if (!this.filters.hasOwnProperty(r.id)) {
                continue;
            }

            const filter = this.filters[r.id];
            if (!filter.path) {
                includes.push(this.getConditionInclude(model, filter.condition));
                continue;
            }

            includes.push(
                this.sequelizeModelScanner.getIncludes(model, {
                    path: filter.path,
                    where: this.generateWhereConditions(filter.where)
                }, [], { include: [] }),
                this.getConditionInclude(model, filter.condition)
            );
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

    private generateWhereOptions(query: QueryModel, options: WhereOptions[]) {
        if (!query.rules) {
            return;
        }

        for (const rule of query.rules) {
            const c = rule as QueryModel;
            if (c.condition) {
                const conditions = [];
                const op = c.condition === "and" ? Op.and : Op.or;
                const where = { [op]: conditions };
                this.generateWhereOptions(c, conditions);

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
            const filterOptions = filter.getWhereOptions(r);
            if (filterOptions) {
                options.push(filterOptions);
            }
        }
    }

    private generateHavingOptions(query: QueryModel, options: WhereOptions[]) {
        if (!query.rules) {
            return;
        }

        for (const rule of query.rules) {
            const c = rule as QueryModel;
            if (c.condition) {
                const conditions = [];
                const op = c.condition === "and" ? Op.and : Op.or;
                const having = { [op]: conditions };
                this.generateHavingOptions(c, conditions);

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
            const filterOptions = filter.getHavingOptions(r);
            if (filterOptions) {
                options.push(filterOptions);
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

    private async countTotalValues(options: FindOptions): Promise<number> {
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

    private async findValues(filter: FilterQueryModel, options: FindOptions): Promise<Data[]> {
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
}
