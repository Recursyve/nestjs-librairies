import { WhereOptions } from "sequelize";
import { QueryRuleModel } from "../models";
import { DateOperators, FilterOperatorTypes } from "../operators";
import { FilterType } from "../type";
import { BaseFilterDefinition, Filter } from "./filter";
import * as moment from "moment";

// Filters a row by exact date and time given in the rules.
// TODO: Do not hard code timezone offset
export class DateTimeFilter extends Filter {
    public type = FilterType.DateTime;
    public operators = [...DateOperators];

    constructor(definition: BaseFilterDefinition) {
        super(definition);
    }

    public async getWhereOptions(rule: QueryRuleModel): Promise<WhereOptions> {
        if (rule.operation === FilterOperatorTypes.Between || rule.operation === FilterOperatorTypes.NotBetween) {
            return super.getWhereOptions({
                ...rule,
                value: [
                    moment(rule.value[0])
                        .utcOffset(-5, true)
                        .format(),
                    moment(rule.value[1])
                        .utcOffset(-5, true)
                        .format()
                ]
            });
        }

        return super.getWhereOptions({
            operation: rule.operation,
            value: moment(rule.value)
                .utcOffset(-5, true)
                .format(),
            id: rule.id
        });
    }
}
