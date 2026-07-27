import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    EnumOrderRule,
    NumberFilter,
    SearchableAttributes,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { Products } from "../models/products.model";

@Data(Products)
@Attributes(["sku", "name", "status", "stock"])
@SearchableAttributes(["name", "sku", "metadata"])
export class ProductsData {}

@Injectable()
export class ProductsFilter extends BaseFilter<ProductsData> {
    public readonly dataDefinition = ProductsData;

    public readonly name = new TextFilter({ attribute: "name" });
    public readonly status = new TextFilter({ attribute: "status" });
    public readonly stock = new NumberFilter({ attribute: "stock" });

    public readonly category = new TextFilter({
        attribute: "metadata",
        json: { type: "object", path: "category" }
    });

    public readonly brand = new TextFilter({
        attribute: "metadata",
        json: { type: "object", path: "brand" }
    });

    public readonly tag = new TextFilter({
        attribute: "tags",
        json: { type: "array" }
    });

    public readonly statusOrder = new EnumOrderRule({
        attribute: "status",
        priorities: ["active", "pending", "inactive"]
    });
}
