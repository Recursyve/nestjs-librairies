import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { StoryArcsController } from "./controllers/story-arcs.controller";
import { StoryArcsFilter } from "./filters/story-arcs.filter";
import { StoryArcs } from "./models/story-arcs.model";

@Module({
    imports: [
        SequelizeModule.forFeature([StoryArcs]),
        DataFilterModule.forFeature({
            filters: [{ filter: StoryArcsFilter }]
        })
    ],
    controllers: [StoryArcsController]
})
export class StoryArcsModule {}
