import { FilterType } from "../type";
import { StringOperators } from "../operators";
import { BaseFilterDefinition, Filter } from "./filter";

export class TextFilter extends Filter {
    public type = FilterType.Text;
    public operators = [...StringOperators];

    constructor(definition: BaseFilterDefinition) {
        super(definition);
    }
}
