import { Expose } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

import { TransformBoolean } from "../decorators/transform-boolean.decorator";

export class GetResourcesDto {
    @Expose()
    @IsBoolean()
    @IsOptional()
    @TransformBoolean()
    public extended?: boolean;
}
