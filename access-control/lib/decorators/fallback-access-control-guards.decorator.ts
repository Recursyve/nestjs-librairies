import type { CanActivate, CustomDecorator, Type } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";
import { FALLBACK_ACCESS_CONTROL_GUARDS } from "./constant";

export const FallbackAccessControlGuards = <T extends CanActivate>(...guards: Type<T>[]): CustomDecorator => {
    return SetMetadata(FALLBACK_ACCESS_CONTROL_GUARDS, guards);
};

