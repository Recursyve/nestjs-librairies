import { literal } from "sequelize";
import { M, SequelizeUtils } from "../../sequelize.utils";
import { BaseOrderRuleDefinition, OrderItemColumn, OrderRule } from "./order-rule";

export class IsNullOrderRule extends OrderRule {
    constructor(definition: BaseOrderRuleDefinition) {
        super(definition);
    }

    public getOrderOption(model: typeof M): OrderItemColumn {
        const order = `${this.path ? SequelizeUtils.getLiteralFullName(this.attribute, this.path) : `\`${model.name}\`.\`${this.attribute}\``} IS NULL`;
        return literal(order);
    }
}
