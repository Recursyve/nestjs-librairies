import { FilterType } from "../type";
import { NumberOperators } from "../operators";
import { BaseFilterDefinition, Filter } from "./filter";

export class NumberFilter extends Filter {
    public type = FilterType.Number;
    public operators = [...NumberOperators];

    constructor(definition?: BaseFilterDefinition) {
        super(definition);
    }
}
