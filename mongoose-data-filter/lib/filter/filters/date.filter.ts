import * as mongoose from "mongoose";
import { QueryRuleModel } from "../models";
import { DateOperators, FilterOperatorTypes } from "../operators";
import { FilterType } from "../type";
import { BaseFilterDefinition, Filter } from "./filter";
import * as moment from "moment";

// Filters a row by exact date given in the rules. We strip the time from the date.
//
// Depending on the inclusivity of your request we use the start of day or end of day, for example if the rule's value
// is "2020-03-06T00:55:12";
//  - And its operator is LessOrEqual we will output "< 2020-03-06T00:00:00" to exclude the given day.
//  - And its operator is Less, we will output "< 2020-03-06T23:59:59" to include the given day.
//
// For Between and NotBetween operators, we always include the given first day and last day, so make sure to shrink your
// timeframe by one day for each side you don't want to include.
export class DateFilter extends Filter {
    public type = FilterType.Date;
    public operators = [...DateOperators];

    constructor(definition: BaseFilterDefinition) {
        super(definition);
    }

    public async getMatchOptions(rule: QueryRuleModel): Promise<mongoose.FilterQuery<any>> {
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
            return super.getMatchOptions({
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
            default:
                return super.getMatchOptions(rule);
        }
    }

    private async getEqualWhereOptions(rule: QueryRuleModel, start: string, end: string): Promise<mongoose.FilterQuery<any>> {
        return super.getMatchOptions({
            operation: FilterOperatorTypes.Between,
            value: [start, end],
            id: rule.id
        });
    }

    private async getNotEqualWhereOptions(rule: QueryRuleModel, start: string, end: string): Promise<mongoose.FilterQuery<any>> {
        return {
            $or: [
                await super.getMatchOptions({
                    operation: FilterOperatorTypes.Less,
                    value: start,
                    id: rule.id
                }),
                await super.getMatchOptions({
                    operation: FilterOperatorTypes.Greater,
                    value: end,
                    id: rule.id
                })
            ]
        };
    }

    private async getLessWhereOptions(rule: QueryRuleModel, start: string): Promise<mongoose.FilterQuery<any>> {
        return super.getMatchOptions({
            operation: FilterOperatorTypes.Less,
            value: start,
            id: rule.id
        });
    }

    private async getLessOrEqualWhereOptions(rule: QueryRuleModel, end: string): Promise<mongoose.FilterQuery<any>> {
        return super.getMatchOptions({
            operation: FilterOperatorTypes.LessOrEqual,
            value: end,
            id: rule.id
        });
    }

    private async getGreaterWhereOptions(rule: QueryRuleModel, end: string): Promise<mongoose.FilterQuery<any>> {
        return super.getMatchOptions({
            operation: FilterOperatorTypes.Greater,
            value: end,
            id: rule.id
        });
    }

    private async getGreaterOrEqualWhereOptions(rule: QueryRuleModel, start: string): Promise<mongoose.FilterQuery<any>> {
        return super.getMatchOptions({
            operation: FilterOperatorTypes.GreaterOrEqual,
            value: start,
            id: rule.id
        });
    }
}
