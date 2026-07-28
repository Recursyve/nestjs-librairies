import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { ArchiveItemsController } from "./controllers/archive-items.controller";
import { ArchiveItemsFilter } from "./filters/archive-items.filter";
import { ArchiveItems } from "./models/archive-items.model";

@Module({
    imports: [
        SequelizeModule.forFeature([ArchiveItems]),
        DataFilterModule.forFeature({
            filters: [{ filter: ArchiveItemsFilter }]
        })
    ],
    controllers: [ArchiveItemsController]
})
export class ArchiveItemsModule {}
