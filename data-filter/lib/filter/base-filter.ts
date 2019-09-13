import { Type } from "@nestjs/common";
import { FilterConfig, FilterModel } from "./models";

export abstract class BaseFilter<T> implements FilterModel<T> {
    [name: string]: FilterConfig | unknown;
    abstract dataDefinition: Type<T>;
}
