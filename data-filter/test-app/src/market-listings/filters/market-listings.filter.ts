import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    DefaultFilter,
    FilterOperatorTypes,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { MarketListings } from "../models/market-listings.model";

@Data(MarketListings)
@Attributes(["title", "visibility"])
export class MarketListingsData {}

@Injectable()
export class MarketListingsFilter extends BaseFilter<MarketListingsData> {
    public readonly dataDefinition = MarketListingsData;

    public readonly defaultFilter = new DefaultFilter(
        {
            id: "visibility",
            operation: FilterOperatorTypes.Equal,
            value: "public"
        },
        false
    );

    public readonly title = new TextFilter({ attribute: "title" });
    public readonly visibility = new TextFilter({ attribute: "visibility" });
}
