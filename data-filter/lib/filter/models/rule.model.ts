import { ApiProperty } from "@nestjs/swagger";
import { FilterOperatorTypes } from "../operators";

export class RuleModel {
    @ApiProperty({ enum: FilterOperatorTypes })
    operation!: FilterOperatorTypes;

    @ApiProperty({
        oneOf: [{ type: "object" }, { type: "array", items: { type: "object" } }],
    })
    value: unknown | unknown[];
}

export interface IRule {
    _type: string;
}
