import { format, parseISO } from "date-fns";
import { WhereOptions } from "sequelize";
import { QueryRuleModel } from "../models";
import { DateOperators, FilterOperatorTypes } from "../operators";
import { BaseFilterDefinition, Filter } from "./filter";
import { FilterType } from "../type";

export class DateOnlyFilter extends Filter  {
    public type = FilterType.Date;
    public operators = [...DateOperators];

    constructor(definition: BaseFilterDefinition) {
        super(definition);
    }

    public override async getWhereOptions(rule: QueryRuleModel): Promise<WhereOptions | undefined> {
        if (rule.operation === FilterOperatorTypes.Between || rule.operation === FilterOperatorTypes.NotBetween) {
            if (!Array.isArray(rule.value)) {
                return;
            }

            return super.getWhereOptions({
                ...rule,
                value: [format(parseISO(rule.value[0]), "yyyy-MM-dd"), format(parseISO(rule.value[1]), "yyyy-MM-dd")],
            });
        }

        const parsedValue = format(parseISO(rule.value as any), "yyyy-MM-dd");

        return super.getWhereOptions({
            operation: rule.operation,
            value: parsedValue,
            id: rule.id
        });
    }
}
