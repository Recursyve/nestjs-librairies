import type { CustomDecorator } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";
import type { AccessControlResourceConfig } from "@recursyve/nestjs-access-control";
import { ACCESS_CONTROL_RESOURCE } from "@recursyve/nestjs-access-control";

export const MongooseAccessControlResource = (model: any, paramId = "id"): CustomDecorator => {
    return SetMetadata(ACCESS_CONTROL_RESOURCE, {
        model,
        paramId,
        type: "mongoose"
    } as AccessControlResourceConfig);
};
