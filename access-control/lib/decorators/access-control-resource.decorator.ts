import { SetMetadata } from "@nestjs/common";
import { AccessControlResourceConfig } from "../models/access-control-resource.model";
import { ACCESS_CONTROL_RESOURCE } from "./constant";

export const AccessControlResource = (model: any, paramId = "id") => {
    return SetMetadata(ACCESS_CONTROL_RESOURCE, {
        model,
        paramId
    } as AccessControlResourceConfig);
};
