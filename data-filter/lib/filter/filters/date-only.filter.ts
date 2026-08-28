import { format, parseISO } from "date-fns";
import { WhereOptions } from "sequelize";
import { QueryRuleModel } from "../models";
import { DateOperators, FilterOperatorTypes } from "../operators";
import { BaseFilterDefinition, Filter } from "./filter";
import { FilterType } from "../type";

export class DateOnlyFilter extends Filter {
    public type = FilterType.Date;
    public operators = [...DateOperators];

    constructor(definition: BaseFilterDefinition) {
        super(definition);
    }

    public override async getWhereOptions(rule: QueryRuleModel): Promise<WhereOptions | undefined> {
        if (rule.operation === FilterOperatorTypes.Between || rule.operation === FilterOperatorTypes.NotBetween) {
            if (
                !Array.isArray(rule.value) ||
                rule.value.length !== 2 ||
                rule.value.some((x) => typeof x !== "string")
            ) {
                return;
            }

            const values = rule.value.map((x) => format(parseISO(x), "yyyy-MM-dd"));
            return super.getWhereOptions({
                ...rule,
                value: values,
            });
        }

        if (typeof rule.value !== "string") {
            return;
        }

        const parsedValue = format(parseISO(rule.value), "yyyy-MM-dd");

        return super.getWhereOptions({
            operation: rule.operation,
            value: parsedValue,
            id: rule.id,
        });
    }
}
