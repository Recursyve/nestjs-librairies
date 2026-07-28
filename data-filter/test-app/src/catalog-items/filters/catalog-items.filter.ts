import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    DefaultFilter,
    FilterOperatorTypes,
    SearchableAttributes,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { CatalogItems } from "../models/catalog-items.model";

@Data(CatalogItems)
@Attributes(["code", "label", "status"])
@SearchableAttributes(["code", "label"])
export class CatalogItemsData {}

@Injectable()
export class CatalogItemsFilter extends BaseFilter<CatalogItemsData> {
    public readonly dataDefinition = CatalogItemsData;

    public readonly defaultFilter = new DefaultFilter(
        {
            id: "status",
            operation: FilterOperatorTypes.Equal,
            value: "published"
        },
        true
    );

    public readonly code = new TextFilter({ attribute: "code" });
    public readonly label = new TextFilter({ attribute: "label" });
    public readonly status = new TextFilter({ attribute: "status" });
}
