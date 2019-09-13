import { Op, WhereOptions } from "sequelize";
import { DateUtils } from "@recursyve/nestjs-common";
import { QueryRuleModel } from "../models";
import { DateOperators, FilterOperatorTypes } from "../operators";
import { FilterType } from "../type";
import { BaseFilterDefinition, Filter } from "./filter";

export class DateFilter extends Filter {
    public type = FilterType.Date;
    public operators = [...DateOperators];

    constructor(definition: BaseFilterDefinition) {
        super(definition);
    }

    public getWhereOptions(rule: QueryRuleModel): WhereOptions {
        if (rule.operation === FilterOperatorTypes.Between || rule.operation === FilterOperatorTypes.NotBetween) {
            return super.getWhereOptions(rule);
        }

        const date = new Date(rule.value as string);
        const rules = [date, DateUtils.getUtcDateOnly(date)].map(d =>
            super.getWhereOptions({
                ...rule,
                value: d
            })
        );
        return {
            [Op.or]: rules
        };
    }
}
