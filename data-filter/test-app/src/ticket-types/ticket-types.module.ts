import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { TicketTypesController } from "./controllers/ticket-types.controller";
import { TicketTypesFilter } from "./filters/ticket-types.filter";
import { TicketTypes } from "./models/ticket-types.model";

@Module({
    imports: [
        SequelizeModule.forFeature([TicketTypes]),
        DataFilterModule.forFeature({
            filters: [{ filter: TicketTypesFilter }]
        })
    ],
    controllers: [TicketTypesController]
})
export class TicketTypesModule {}
