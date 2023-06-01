import { FilterDefinition } from "../filters/filter";
import { SelectFilterDefinition } from "../filters/select.filter";
import { Type } from "@nestjs/common";

export type FilterConfig = FilterDefinition & SelectFilterDefinition<unknown>;

export interface FilterModel<T> {
    dataDefinition: Type<T>;
    [name: string]: FilterConfig | unknown;
}
