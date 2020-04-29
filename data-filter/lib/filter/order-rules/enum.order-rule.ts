import { literal } from "sequelize";
import { SequelizeUtils } from "../../sequelize.utils";
import { BaseOrderRuleDefinition, OrderItemColumn, OrderRule } from "./order-rule";

export interface EnumOrderRuleDefinition {
    priority: string[];
}

export class EnumOrderRule extends OrderRule implements EnumOrderRuleDefinition {
    public priority: string[];

    constructor(definition: BaseOrderRuleDefinition & EnumOrderRuleDefinition) {
        super(definition);
    }

    public getOrderOption(): OrderItemColumn {
        let order = `CASE ${this.path ? SequelizeUtils.getLiteralFullName(this.attribute, this.path) : this.attribute} `;
        for (let i = 0; i < this.priority.length; ++i) {
            order += `WHEN '${this.priority[i]}' THEN ${this.priority.length - i} `;
        }
        order += `ELSE 0 END`;
        return literal(order);
    }
}
