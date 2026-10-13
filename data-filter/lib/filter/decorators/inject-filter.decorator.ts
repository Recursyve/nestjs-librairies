import type { Type } from "@nestjs/common";
import { Inject } from "@nestjs/common";

import { BaseFilter } from "../base-filter";
import { FilterUtils } from "../filter.utils";

export const InjectFilter = (filter: Type<BaseFilter<any>>): PropertyDecorator & ParameterDecorator =>
    Inject(FilterUtils.getProviderToken(filter));
