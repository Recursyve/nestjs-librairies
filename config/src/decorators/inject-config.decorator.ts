import { Inject, Type } from "@nestjs/common";
import { ConfigUtils } from "../config.utils";

export const InjectConfig = (config: Type) => Inject(ConfigUtils.getProviderToken(config));
