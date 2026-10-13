import { FilterType } from "../type";
import { FilterOperatorTypes, NumberOperators } from "../operators";
import type { BaseFilterDefinition } from "./filter";
import { Filter } from "./filter";

export class NumberFilter extends Filter {
    public override type: FilterType = FilterType.Number;
    public override operators: FilterOperatorTypes[] = [...NumberOperators];

    constructor(definition?: BaseFilterDefinition) {
        super(definition);
    }
}
