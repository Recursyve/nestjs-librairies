import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsIn } from "class-validator";
import { FilterOperatorTypes } from "../operators";

export class RuleModel {
    @IsIn(Object.values(FilterOperatorTypes))
    @ApiProperty({ enum: FilterOperatorTypes, enumName: "FilterOperatorTypes" })
    operation!: FilterOperatorTypes;

    @IsDefined()
    @ApiProperty({
        oneOf: [{ type: "object" }, { type: "array", items: { type: "object" } }],
    })
    value: unknown | unknown[];
}

export interface IRule {
    _type: string;
}
