import { M, SequelizeUtils } from "../../sequelize.utils";
import { BaseOrderRuleDefinition, OrderItemColumn, OrderRule } from "./order-rule";

export class TranslationOrderRule extends OrderRule {
    constructor(definition: BaseOrderRuleDefinition, private readonly defaultLanguage: string) {
        super(definition);
    }

    public getOrderOption(model: typeof M, language: string | null): OrderItemColumn {
        const lang = language ?? this.defaultLanguage;
        return `UPPER(JSON_UNQUOTE(JSON_EXTRACT(${`\`${model.name}\`.\`${this.attribute}\``}, '$.${lang}')))`;
    }
}
