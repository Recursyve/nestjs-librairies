import type { CustomDecorator } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";

import type { AccessControlResourceConfig } from "../models/access-control-resource.model";
import { ACCESS_CONTROL_RESOURCE } from "./constant";

export const AccessControlResource = (model: any, paramId = "id", type?: string): CustomDecorator => {
    return SetMetadata(ACCESS_CONTROL_RESOURCE, {
        model,
        paramId,
        type
    } as AccessControlResourceConfig);
};
