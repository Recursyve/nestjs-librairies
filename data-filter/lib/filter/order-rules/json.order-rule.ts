import { literal } from "sequelize";
import { M, SequelizeUtils } from "../../sequelize.utils";
import { BaseOrderRuleDefinition, OrderItemColumn, OrderRule, OrderRuleContext } from "./order-rule";
import { JsonConfig } from "../..";

export interface JsonRuleDefinition {
    json: JsonConfig;
}

export class JsonOrderRule extends OrderRule implements JsonRuleDefinition {
    public json!: JsonConfig;

    constructor(definition: BaseOrderRuleDefinition & JsonRuleDefinition) {
        super(definition);
    }

    public getOrderOption(model: typeof M, context: OrderRuleContext): OrderItemColumn {
        const jsonPath = typeof this.json.path === "function" ? this.json.path(context) : this.json.path;
        const modelPath = this.getModelPath(model);
        return literal(`UPPER(JSON_UNQUOTE(JSON_EXTRACT(${modelPath}, '$.${jsonPath}')))`);
    }

    private getModelPath(model: typeof M): string {
        if (this.path) {
            return SequelizeUtils.getLiteralFullName(this.attribute, this.path);
        }

        return `\`${model.name}\`.\`${this.attribute}\``;
    }
}
