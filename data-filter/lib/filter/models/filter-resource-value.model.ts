import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty, IsString } from "class-validator";

export class FilterResourceValueModel {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: () => String })
    id!: string;

    @IsDefined()
    @ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }] })
    resourceId!: number | string;
}
