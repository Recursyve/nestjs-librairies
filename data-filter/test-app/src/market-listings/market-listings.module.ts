import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { MarketListingsController } from "./controllers/market-listings.controller";
import { MarketListingsFilter } from "./filters/market-listings.filter";
import { MarketListings } from "./models/market-listings.model";

@Module({
    imports: [
        SequelizeModule.forFeature([MarketListings]),
        DataFilterModule.forFeature({
            filters: [{ filter: MarketListingsFilter }]
        })
    ],
    controllers: [MarketListingsController]
})
export class MarketListingsModule {}
