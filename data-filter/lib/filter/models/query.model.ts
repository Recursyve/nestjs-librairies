import { ApiExtraModels, ApiProperty, getSchemaPath } from "@nestjs/swagger";
import { RuleModel } from "./rule.model";

const conditions = ["and", "or"] as const;
export type Condition = (typeof conditions)[number];

export class QueryRuleModel extends RuleModel {
    @ApiProperty({ type: () => String })
    id!: string;
}

@ApiExtraModels(QueryRuleModel)
export class QueryModel {
    @ApiProperty({ enum: conditions, enumName: "Condition" })
    condition!: Condition;

    @ApiProperty({
        oneOf: [
            { type: "array", items: { $ref: getSchemaPath(QueryRuleModel) } },
            { type: "array", items: { $ref: getSchemaPath(QueryModel) } },
        ],
    })
    rules!: (QueryRuleModel | QueryModel)[];
}
