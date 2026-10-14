import { DateFilter } from "./date.filter";
import type { BaseFilterDefinition } from "./filter";

export class DateOnlyFilter extends DateFilter {
    constructor(definition: BaseFilterDefinition) {
        super({
            ...definition,
            skipTimezone: true
        });
    }
}
