import { SetMetadata } from "@nestjs/common";
import { AccessControlResourceConfig } from "@recursyve/nestjs-access-control";
import { ACCESS_CONTROL_RESOURCE } from "@recursyve/nestjs-access-control";

export const MongooseAccessControlResource = (model: any, paramId = "id") => {
    return SetMetadata(ACCESS_CONTROL_RESOURCE, {
        model,
        paramId,
        type: "mongoose"
    } as AccessControlResourceConfig);
};
