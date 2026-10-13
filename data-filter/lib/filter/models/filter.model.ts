import type { FilterDefinition } from "../filters/filter";
import type { SelectFilterDefinition } from "../filters/select.filter";
import type { Type } from "@nestjs/common";

export type FilterConfig = FilterDefinition & SelectFilterDefinition<unknown>;

export interface FilterModel<T> {
    dataDefinition: Type<T>;
    [name: string]: FilterConfig | unknown;
}
