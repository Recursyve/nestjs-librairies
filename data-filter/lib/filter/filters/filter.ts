import { CustomOperator, FilterOperators, FilterOperatorTypes } from "../operators";
import { FilterType } from "../type";
import { FilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { Op, where, WhereOperators, WhereOptions } from "sequelize";
import { QueryRuleModel } from "../models/query.model";
import { SequelizeUtils } from "../../sequelize.utils";
import { RuleModel } from "../models/rule.model";
import { FilterUtils } from "../filter.utils";
import { IncludeWhereModel } from "../../models/include.model";
import { Users } from "@recursyve/nestjs-access-control";

export type Condition = "and" | "or";

export interface FilterConditionRule extends RuleModel {
    key: string;
    path?: string;
}

export interface FilterCondition {
    condition: Condition;
    rules: (FilterConditionRule | FilterCondition)[];
}

export interface BaseFilterDefinition {
    attribute: string;
    path?: string;
    having?: any;
    condition?: FilterCondition;
    group?: string;
    where?: IncludeWhereModel;
}

export interface FilterDefinition extends BaseFilterDefinition {
    type: FilterType;
    operators: (FilterOperatorTypes | CustomOperator)[];

    getConfig(key: string, user?: Users): Promise<FilterBaseConfigurationModel>;
    getWhereOptions(rule: QueryRuleModel): WhereOptions;
    getHavingOptions(rule: QueryRuleModel): WhereOptions;
}

export abstract class Filter implements FilterDefinition {
    public type: FilterType;
    public operators: (FilterOperatorTypes | CustomOperator)[];
    public group: string;
    public attribute: string;
    public having?: any;
    public path?: string;
    public condition?: FilterCondition;

    public static validate(definition: FilterDefinition) {
        return typeof definition === "object" && definition.type && definition.operators && definition.attribute;
    }

    // public abstract valueFormatter(rule: QueryRuleModel): unknown;

    protected constructor(definition: BaseFilterDefinition) {
        Object.assign(this, definition);
    }

    public addOperators(...operator: (FilterOperatorTypes | CustomOperator)[]): Filter {
        this.operators.push(...operator);
        return this;
    }

    public setOperators(...operator: (FilterOperatorTypes | CustomOperator)[]): Filter {
        this.operators = [...operator];
        return this;
    }

    public async getConfig(key: string, user?: Users): Promise<FilterBaseConfigurationModel> {
        return {
            type: this.type,
            group: {
                key: this.group,
                name: this.group
            },
            operators: this.operators.map(x => {
                if (typeof x === "string") {
                    return {
                        id: x,
                        name: x
                    };
                }

                return {
                    id: x.name,
                    name: x.name
                };
            })
        };
    }

    public getWhereOptions(rule: QueryRuleModel): WhereOptions {
        const name = this.path ? SequelizeUtils.getAttributeFullName(this.attribute, this.path) : this.attribute;

        const op = this.operators.find(x => {
            if (typeof x === "string") {
                return false;
            }

            return x.name === rule.operation;
        }) as CustomOperator;
        if (op && op.operator) {
            rule.operation = op.operator;
        }

        const value = SequelizeUtils.generateWhereValue(rule);
        if (value === undefined || this.having) {
            return this.getConditionWhereOptions(null);
        }

        return this.getConditionWhereOptions({
            [name]: value
        });
    }

    public getHavingOptions(rule: QueryRuleModel): WhereOptions {
        if (!this.having) {
            return this.getOperatorHavingOptions(rule.operation, null);
        }

        let options: WhereOptions;
        if (this.having.attribute) {
            options = this.having;
        } else {
            const value = SequelizeUtils.generateWhereValue(rule) as WhereOperators;
            if (value !== null || typeof value !== "undefined") {
                options = where(this.having, value);
            }
        }

        return this.getOperatorHavingOptions(rule.operation, options);
    }

    private getConditionWhereOptions(where: WhereOptions): WhereOptions {
        if (!this.condition) {
            return where;
        }

        const conditions = where ? [where] : [];
        const option = this.condition.condition === "and" ? { [Op.and]: conditions } : { [Op.or]: conditions };
        this.generateRuleWhereOptions(this.condition, conditions);
        return option;
    }

    private generateRuleWhereOptions(filter: FilterCondition, options: WhereOptions[]) {
        for (const rule of filter.rules) {
            const c = rule as FilterCondition;
            if (c.condition) {
                const conditions = [];
                options.push(c.condition === "and" ? { [Op.and]: conditions } : { [Op.or]: [] });
                this.generateRuleWhereOptions(c, conditions);
                continue;
            }

            const r = rule as FilterConditionRule;
            const name = r.path ? SequelizeUtils.getAttributeFullName(r.key, r.path) : r.key;
            options.push({
                [name]: SequelizeUtils.generateWhereValue(rule as RuleModel)
            });
        }
    }

    private getOperatorHavingOptions(operator: FilterOperators, where: WhereOptions): WhereOptions {
        const op = this.operators.find(x => {
            if (typeof x === "string") {
                return false;
            }

            return x.name === operator;
        }) as CustomOperator;
        if (!op) {
            return where;
        }

        if (!op.having) {
            return where;
        }

        return where
            ? {
                  [Op.and]: [where, op.having]
              }
            : op.having;
    }
}
