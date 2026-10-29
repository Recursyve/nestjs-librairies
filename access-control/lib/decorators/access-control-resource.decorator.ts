import type { CustomDecorator } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";

import type { AccessControlModel } from "../adapters/database.adapter";
import { ACCESS_CONTROL_RESOURCE } from "./constant";

export const AccessControlResource = (model: AccessControlModel, paramId = "id", type?: string): CustomDecorator => {
    return SetMetadata(ACCESS_CONTROL_RESOURCE, {
        model,
        paramId,
        type
    });
};
