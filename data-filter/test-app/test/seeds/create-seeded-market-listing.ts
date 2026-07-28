import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { MarketListings } from "../../src/market-listings/models/market-listings.model";
import { Seeded } from "./seeded.type";

type CreateSeededMarketListingParams = {
    title: string;
    visibility: string;
};

type SeededMarketListing = Seeded<{
    id: number;
    title: string;
    visibility: string;
}>;

export async function createSeededMarketListing(params: CreateSeededMarketListingParams): Promise<SeededMarketListing> {
    const row = await MarketListings.create(params);
    if (!arePropertiesDefined(row, "id", "title", "visibility")) {
        throw new Error("Failed to seed market listing");
    }

    return {
        id: row.id,
        title: row.title,
        visibility: row.visibility,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}
