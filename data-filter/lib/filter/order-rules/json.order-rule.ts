import { literal } from "sequelize";
import { M } from "../../sequelize.utils";
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
        const path = typeof this.json.path === "function" ? this.json.path(context) : this.json.path;
        return literal(`UPPER(JSON_UNQUOTE(JSON_EXTRACT(${`\`${model.name}\`.\`${this.attribute}\``}, '$.${path}')))`);
    }
}
