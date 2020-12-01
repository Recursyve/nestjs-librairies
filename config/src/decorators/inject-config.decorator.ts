import { Inject, Type } from "@nestjs/common";
import { ConfigUtils } from "../config.utils";

export const InjectConfig = (config: Type<any>) => Inject(ConfigUtils.getProviderToken(config));
