import { QueryFilter } from "mongoose";
import { OrderModel } from "../..";
import { AddFieldModel } from "../../models/add-field.model";

export type SortItemColumn = string;

export interface BaseSortRuleDefinition {
    attribute: string;
    path?: string;
    where?: QueryFilter<any>;
}

export interface SortRuleDefinition extends BaseSortRuleDefinition {
    getSortOption(): SortItemColumn;
    getFieldsToAdd(order: OrderModel): AddFieldModel[];
}

export abstract class SortRule implements SortRuleDefinition {
    private _type = "sort_rule";

    public attribute: string;
    public path?: string;
    public where?: QueryFilter<any>;

    protected constructor(definition?: BaseSortRuleDefinition) {
        if (definition) {
            Object.assign(this, definition);
        }
    }

    public static validate(definition: BaseSortRuleDefinition) {
        return definition["_type"] === "sort_rule";
    }

    public abstract getSortOption(): SortItemColumn;
    public abstract getFieldsToAdd(order: OrderModel): AddFieldModel[];
}
