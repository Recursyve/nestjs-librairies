import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { CatalogItemsController } from "./controllers/catalog-items.controller";
import { CatalogItemsFilter } from "./filters/catalog-items.filter";
import { CatalogItems } from "./models/catalog-items.model";

@Module({
    imports: [
        SequelizeModule.forFeature([CatalogItems]),
        DataFilterModule.forFeature({
            filters: [{ filter: CatalogItemsFilter }]
        })
    ],
    controllers: [CatalogItemsController]
})
export class CatalogItemsModule {}
