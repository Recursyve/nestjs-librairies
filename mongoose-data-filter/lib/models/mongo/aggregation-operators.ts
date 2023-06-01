export abstract class AggregationOperator {
    public abstract transform(): any;
}

export class FilterOperation extends AggregationOperator {
    constructor(private input: string, private as: string, private condition: any) {
        super();
    }

    public transform(): any {
        return {
            $filter: {
                input: this.input,
                as: this.as,
                cond: this.condition
            }
        }
    }
}

export class ConditionOperation extends AggregationOperator {
    constructor(private condition: any, private thenValue: any, private elseValue: any) {
        super();
    }

    public transform(): any {
        return {
            $cond: {
                if: this.condition,
                then: this.thenValue,
                else: this.elseValue
            }
        }
    }
}
