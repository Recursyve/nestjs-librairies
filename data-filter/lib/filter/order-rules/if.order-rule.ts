import { literal } from "sequelize";
import { SequelizeUtils } from "../../sequelize.utils";
import { BaseOrderRuleDefinition, OrderItemColumn, OrderRule } from "./order-rule";

export interface IfOrderRuleDefinition {
    valueEquals: any;
    priority?: number;
    fallbackPriority?: number;
}

export class IfOrderRule extends OrderRule implements IfOrderRuleDefinition {
    public valueEquals: any;
    public priority: any;
    public fallbackPriority: any;

    constructor(definition: BaseOrderRuleDefinition & IfOrderRuleDefinition) {
        super(definition);
    }

    public getOrderOption(): OrderItemColumn {
        const order = `IF(${this.path ? SequelizeUtils.getLiteralFullName(this.attribute, this.path) : this.attribute}='${this.valueEquals}',${this.priority ?? 1},${this.fallbackPriority ?? 0})`;
        return literal(order);
    }
}
