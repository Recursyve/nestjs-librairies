import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { SubscribersController } from "./controllers/subscribers.controller";
import { SubscribersFilter } from "./filters/subscribers.filter";
import { Subscribers } from "./models/subscribers.model";

@Module({
    imports: [
        SequelizeModule.forFeature([Subscribers]),
        DataFilterModule.forFeature({
            filters: [{ filter: SubscribersFilter }]
        })
    ],
    controllers: [SubscribersController]
})
export class SubscribersModule {}
