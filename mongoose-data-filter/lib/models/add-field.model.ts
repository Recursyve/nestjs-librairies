import { AggregationOperator } from "./mongo/aggregation-operators";

export type AddFieldExpression = AggregationOperator | string | number | Date;

export class AddFieldModel {
    constructor(public name: string, public expression: AddFieldExpression, public unwind: boolean) {}

    public transform(): any {
        if (this.expression instanceof AggregationOperator) {
            return {
                [this.name]: this.expression.transform()
            }
        }

        return {
            [this.name]: this.expression
        };
    }
}
