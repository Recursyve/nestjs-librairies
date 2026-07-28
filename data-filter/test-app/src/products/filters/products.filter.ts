import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    DateTimeFilter,
    EnumOrderRule,
    FilterOperatorTypes,
    GroupFilter,
    NumberFilter,
    OptionsFilter,
    SearchableAttributes,
    SearchableTranslationAttributes,
    SelectFilter,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { Products } from "../models/products.model";

@Data(Products)
@Attributes(["sku", "name", "status", "stock", "listed_at"])
@SearchableAttributes(["name", "sku", "metadata"])
@SearchableTranslationAttributes(["translations"])
export class ProductsData {}

@Injectable()
export class ProductsFilter extends BaseFilter<ProductsData> {
    public readonly dataDefinition = ProductsData;

    public readonly name = new TextFilter({ attribute: "name" });
    public readonly status = new TextFilter({ attribute: "status" });
    public readonly stock = new NumberFilter({ attribute: "stock" });
    public readonly listedAt = new DateTimeFilter({ attribute: "listed_at" });

    public readonly stockTier = new OptionsFilter({
        attribute: "stock",
        selectionMode: "select",
        options: [
            { key: "low", value: 5, operator: FilterOperatorTypes.LessOrEqual },
            { key: "high", value: 5, operator: FilterOperatorTypes.Greater },
            {
                key: "active-low",
                value: 10,
                operator: FilterOperatorTypes.LessOrEqual,
                condition: {
                    condition: "and",
                    rules: [{ key: "status", value: "active", operation: FilterOperatorTypes.Equal }]
                }
            }
        ]
    });

    public readonly stockStatusGroup = new GroupFilter({
        rootFilter: new SelectFilter({
            attribute: "status",
            values: async () =>
                Promise.resolve([
                    { id: "active", name: "Active" },
                    { id: "pending", name: "Pending" },
                    { id: "inactive", name: "Inactive" }
                ]),
            lazyLoading: false
        }),
        valueFilter: new NumberFilter({ attribute: "stock" })
    });

    public readonly lazyStockGroup = new GroupFilter({
        lazyLoading: true,
        rootFilter: new SelectFilter({
            attribute: "status",
            values: async () =>
                Promise.resolve([
                    { id: "active", name: "Active" },
                    { id: "pending", name: "Pending" }
                ]),
            lazyLoading: true
        }),
        getValueFilter: async () => Promise.resolve(new NumberFilter({ attribute: "stock" }))
    });

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
