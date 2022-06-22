import { Expose } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";
import { TransformBoolean } from "../decorators";

export class GetResourcesDto {
    @Expose()
    @IsBoolean()
    @IsOptional()
    @TransformBoolean()
    extended?: boolean;
}
