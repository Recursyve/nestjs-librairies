import { CanActivate, SetMetadata, Type } from "@nestjs/common";
import { FALLBACK_ACCESS_CONTROL_GUARDS } from "./constant";

export const FallbackAccessControlGuards = <T extends CanActivate>(...guards: Type<T>[]) => {
    return SetMetadata(FALLBACK_ACCESS_CONTROL_GUARDS, guards);
};

