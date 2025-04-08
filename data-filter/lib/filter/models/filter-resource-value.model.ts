import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class FilterResourceValueModel {
    @Expose()
    @ApiProperty({ type: () => String })
    id!: string;

    @Expose()
    @ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }] })
    resourceId!: number | string;
}
