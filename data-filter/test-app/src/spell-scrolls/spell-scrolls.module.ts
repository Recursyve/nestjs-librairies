import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { SpellScrollsController } from "./controllers/spell-scrolls.controller";
import { SpellScrollsProbesController } from "./controllers/spell-scrolls-probes.controller";
import { SpellScrollsFilter } from "./filters/spell-scrolls.filter";
import { SpellScrolls } from "./models/spell-scrolls.model";

@Module({
    imports: [
        SequelizeModule.forFeature([SpellScrolls]),
        DataFilterModule.forFeature({
            filters: [{ filter: SpellScrollsFilter }]
        })
    ],
    controllers: [SpellScrollsController, SpellScrollsProbesController]
})
export class SpellScrollsModule {}
