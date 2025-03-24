import { literal } from "sequelize";
import { M } from "../../sequelize.utils";
import { BaseOrderRuleDefinition, OrderItemColumn, OrderRule } from "./order-rule";

export interface TranslationRuleDefinition {
    defaultLanguage: string;
}

export class TranslationOrderRule extends OrderRule implements TranslationRuleDefinition {
    public defaultLanguage!: string;

    constructor(definition: BaseOrderRuleDefinition & TranslationRuleDefinition) {
        super(definition);
    }

    public getOrderOption(model: typeof M, language: string | null): OrderItemColumn {
        const lang = language ?? this.defaultLanguage;
        return literal(`UPPER(JSON_UNQUOTE(JSON_EXTRACT(${`\`${model.name}\`.\`${this.attribute}\``}, '$.${lang}')))`);
    }
}
