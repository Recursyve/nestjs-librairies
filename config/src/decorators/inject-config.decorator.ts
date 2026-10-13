import type { Type } from "@nestjs/common";
import { Inject } from "@nestjs/common";

import { ConfigUtils } from "../config.utils";

export const InjectConfig = (config: Type): ParameterDecorator & PropertyDecorator =>
    Inject(ConfigUtils.getProviderToken(config));
