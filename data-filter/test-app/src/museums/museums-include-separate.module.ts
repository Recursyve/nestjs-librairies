import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { MuseumsIncludeSeparateController } from "./controllers/museums-include-separate.controller";
import { MuseumsIncludeSeparateFilter } from "./filters/museums-include-separate.filter";
import { Museums } from "./models/museums.model";

/**
 * Intentionally broken Include(path, true) on BelongsTo.
 * Kept out of AppModule so validateData does not log collateral errors.
 */
@Module({
    imports: [
        SequelizeModule.forFeature([Museums]),
        DataFilterModule.forFeature({
            filters: [{ filter: MuseumsIncludeSeparateFilter }]
        })
    ],
    controllers: [MuseumsIncludeSeparateController]
})
export class MuseumsIncludeSeparateModule {}
