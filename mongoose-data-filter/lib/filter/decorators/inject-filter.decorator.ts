import { Inject, Type } from "@nestjs/common";
import { BaseFilter } from "../base-filter";
import { FilterUtils } from "../filter.utils";

export const InjectFilter = (filter: Type<BaseFilter<any>>) => Inject(FilterUtils.getProviderToken(filter));
