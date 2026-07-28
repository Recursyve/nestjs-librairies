import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { RawEventsController } from "./controllers/raw-events.controller";
import { RawEventsFilter } from "./filters/raw-events.filter";
import { RawEvents } from "./models/raw-events.model";

@Module({
    imports: [
        SequelizeModule.forFeature([RawEvents]),
        DataFilterModule.forFeature({
            filters: [{ filter: RawEventsFilter }]
        })
    ],
    controllers: [RawEventsController]
})
export class RawEventsModule {}
