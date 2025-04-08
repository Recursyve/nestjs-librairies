import { ApiExtraModels, ApiProperty, getSchemaPath } from "@nestjs/swagger";
import { IsArray, IsIn, IsString } from "class-validator";
import { RuleModel } from "./rule.model";

const conditions = ["and", "or"] as const;
export type Condition = (typeof conditions)[number];

export class QueryRuleModel extends RuleModel {
    @IsString()
    @ApiProperty({ type: () => String })
    id!: string;
}

@ApiExtraModels(QueryRuleModel)
export class QueryModel {
    @IsIn(conditions)
    @ApiProperty({ enum: conditions, enumName: "Condition" })
    condition!: Condition;

    @IsArray()
    @ApiProperty({
        oneOf: [
            { type: "array", items: { $ref: getSchemaPath(QueryRuleModel) } },
            { type: "array", items: { $ref: getSchemaPath(QueryModel) } },
        ],
    })
    rules!: (QueryRuleModel | QueryModel)[];
}
