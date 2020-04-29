import { literal } from "sequelize";
import { SequelizeUtils } from "../../sequelize.utils";
import { BaseOrderRuleDefinition, OrderItemColumn, OrderRule } from "./order-rule";

export interface EnumOrderRuleDefinition {
    priorities: string[];
}

export class EnumOrderRule extends OrderRule implements EnumOrderRuleDefinition {
    public priorities: string[];

    constructor(definition: BaseOrderRuleDefinition & EnumOrderRuleDefinition) {
        super(definition);
    }

    public getOrderOption(): OrderItemColumn {
        let order = `CASE ${this.path ? SequelizeUtils.getLiteralFullName(this.attribute, this.path) : this.attribute} `;
        for (let i = 0; i < this.priorities.length; ++i) {
            order += `WHEN '${this.priorities[i]}' THEN ${this.priorities.length - i} `;
        }
        order += `ELSE 0 END`;
        return literal(order);
    }
}
