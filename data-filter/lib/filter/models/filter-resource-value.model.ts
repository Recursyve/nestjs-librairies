import { ApiProperty } from "@nestjs/swagger";

export class FilterResourceValueModel {
    @ApiProperty({ type: () => String })
    id!: string;

    @ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }] })
    resourceId!: number | string;
}
