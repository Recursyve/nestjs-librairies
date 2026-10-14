import type { Type } from "@nestjs/common";

import type { FilterDefinition } from "../filters/filter";
import type { SelectFilterDefinition } from "../filters/select.filter";

export type FilterConfig = FilterDefinition & SelectFilterDefinition<unknown>;

export interface FilterModel<T> {
    dataDefinition: Type<T>;
    [name: string]: FilterConfig | unknown;
}
