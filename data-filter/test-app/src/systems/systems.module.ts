import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { SystemsController } from "./controllers/systems.controller";
import { SystemsFilter } from "./filters/systems.filter";
import { Systems } from "./models/systems.model";

@Module({
    imports: [
        SequelizeModule.forFeature([Systems]),
        DataFilterModule.forFeature({
            filters: [{ filter: SystemsFilter }]
        })
    ],
    controllers: [SystemsController]
})
export class SystemsModule {}
