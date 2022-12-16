import { SetMetadata } from "@nestjs/common";
import { AccessControlResourceConfig } from "../models/access-control-resource.model";
import { ACCESS_CONTROL_RESOURCE } from "./constant";

export const AccessControlResource = (model: any, paramId = "id", type?: string) => {
    return SetMetadata(ACCESS_CONTROL_RESOURCE, {
        model,
        paramId,
        type
    } as AccessControlResourceConfig);
};
