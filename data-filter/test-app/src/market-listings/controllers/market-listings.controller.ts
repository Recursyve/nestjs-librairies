import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { MarketListingsData, MarketListingsFilter } from "../filters/market-listings.filter";

@Controller("market-listings")
export class MarketListingsController extends FilterController<MarketListingsData> {
    constructor(@InjectFilter(MarketListingsFilter) filterService: FilterService<MarketListingsData>) {
        super(filterService);
    }
}
