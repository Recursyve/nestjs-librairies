import { Op, WhereOptions } from "sequelize";
import { QueryRuleModel } from "../models";
import { DateOperators, FilterOperatorTypes } from "../operators";
import { FilterType } from "../type";
import { BaseFilterDefinition, Filter } from "./filter";
import * as moment from "moment";

export class DateFilter extends Filter {
    public type = FilterType.Date;
    public operators = [...DateOperators];

    constructor(definition: BaseFilterDefinition) {
        super(definition);
    }

    public async getWhereOptions(rule: QueryRuleModel): Promise<WhereOptions> {
        if (rule.operation === FilterOperatorTypes.Between || rule.operation === FilterOperatorTypes.NotBetween) {
            const values = [
                moment(rule.value[0])
                    .startOf("day")
                    .utcOffset(-5, true)
                    .format(),
                moment(rule.value[1])
                    .endOf("day")
                    .utcOffset(-5, true)
                    .format()
            ];
            return super.getWhereOptions({
                ...rule,
                value: values
            });
        }

        // TODO: Do not hard code timezone offset
        const start = moment(rule.value)
            .startOf("day")
            .utcOffset(-5, true)
            .format();
        const end = moment(rule.value)
            .endOf("day")
            .utcOffset(-5, true)
            .format();
        switch (rule.operation) {
            case FilterOperatorTypes.Equal:
                return this.getEqualWhereOptions(rule, start, end);
            case FilterOperatorTypes.NotEqual:
                return this.getNotEqualWhereOptions(rule, start, end);
            case FilterOperatorTypes.Less:
                return this.getLessWhereOptions(rule, start);
            case FilterOperatorTypes.LessOrEqual:
                return this.getLessOrEqualWhereOptions(rule, end);
            case FilterOperatorTypes.Greater:
                return this.getGreaterWhereOptions(rule, end);
            case FilterOperatorTypes.GreaterOrEqual:
                return this.getGreaterOrEqualWhereOptions(rule, start);
        }
    }

    private async getEqualWhereOptions(rule: QueryRuleModel, start: string, end: string): Promise<WhereOptions> {
        return super.getWhereOptions({
            operation: FilterOperatorTypes.Between,
            value: [start, end],
            id: rule.id
        });
    }

    private async getNotEqualWhereOptions(rule: QueryRuleModel, start: string, end: string): Promise<WhereOptions> {
        return {
            [Op.or]: [
                await super.getWhereOptions({
                    operation: FilterOperatorTypes.Less,
                    value: start,
                    id: rule.id
                }),
                await super.getWhereOptions({
                    operation: FilterOperatorTypes.Greater,
                    value: end,
                    id: rule.id
                })
            ]
        };
    }

    private async getLessWhereOptions(rule: QueryRuleModel, start: string): Promise<WhereOptions> {
        return super.getWhereOptions({
            operation: FilterOperatorTypes.Less,
            value: start,
            id: rule.id
        });
    }

    private async getLessOrEqualWhereOptions(rule: QueryRuleModel, end: string): Promise<WhereOptions> {
        return super.getWhereOptions({
            operation: FilterOperatorTypes.LessOrEqual,
            value: end,
            id: rule.id
        });
    }

    private async getGreaterWhereOptions(rule: QueryRuleModel, end: string): Promise<WhereOptions> {
        return super.getWhereOptions({
            operation: FilterOperatorTypes.Greater,
            value: end,
            id: rule.id
        });
    }

    private async getGreaterOrEqualWhereOptions(rule: QueryRuleModel, start: string): Promise<WhereOptions> {
        return super.getWhereOptions({
            operation: FilterOperatorTypes.GreaterOrEqual,
            value: start,
            id: rule.id
        });
    }
}
