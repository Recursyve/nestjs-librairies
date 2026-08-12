import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { Artifacts } from "../artifacts/models/artifacts.model";
import { MuseumsIncludeConfigController } from "./controllers/museums-include-config.controller";
import { MuseumsIncludeNestedController } from "./controllers/museums-include-nested.controller";
import { MuseumsIncludingDeletedController } from "./controllers/museums-including-deleted.controller";
import { MuseumsOrderedLimitedController } from "./controllers/museums-ordered-limited.controller";
import { MuseumsPathWhereController } from "./controllers/museums-path-where.controller";
import { MuseumsRequiredController } from "./controllers/museums-required.controller";
import { MuseumsSeparateSearchableController } from "./controllers/museums-separate-searchable.controller";
import { MuseumsSeparateController } from "./controllers/museums-separate.controller";
import { MuseumsController } from "./controllers/museums.controller";
import { MuseumsIncludeConfigFilter } from "./filters/museums-include-config.filter";
import { MuseumsIncludeNestedFilter } from "./filters/museums-include-nested.filter";
import { MuseumsIncludingDeletedFilter } from "./filters/museums-including-deleted.filter";
import { MuseumsOrderedLimitedFilter } from "./filters/museums-ordered-limited.filter";
import { MuseumsPathWhereFilter } from "./filters/museums-path-where.filter";
import { MuseumsRequiredFilter } from "./filters/museums-required.filter";
import { MuseumsSeparateSearchableFilter } from "./filters/museums-separate-searchable.filter";
import { MuseumsSeparateFilter } from "./filters/museums-separate.filter";
import { MuseumsFilter } from "./filters/museums.filter";
import { Museums } from "./models/museums.model";

@Module({
    imports: [
        SequelizeModule.forFeature([Museums, Artifacts]),
        DataFilterModule.forFeature({
            filters: [
                { filter: MuseumsFilter },
                { filter: MuseumsOrderedLimitedFilter },
                { filter: MuseumsIncludingDeletedFilter },
                { filter: MuseumsSeparateFilter },
                { filter: MuseumsSeparateSearchableFilter },
                { filter: MuseumsPathWhereFilter },
                { filter: MuseumsRequiredFilter },
                { filter: MuseumsIncludeNestedFilter },
                { filter: MuseumsIncludeConfigFilter }
            ]
        })
    ],
    controllers: [
        MuseumsController,
        MuseumsOrderedLimitedController,
        MuseumsIncludingDeletedController,
        MuseumsSeparateController,
        MuseumsSeparateSearchableController,
        MuseumsPathWhereController,
        MuseumsRequiredController,
        MuseumsIncludeNestedController,
        MuseumsIncludeConfigController
    ]
})
export class MuseumsModule {}
