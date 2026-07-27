import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { CoordsController } from "./controllers/coords.controller";
import { CoordsFilter } from "./filters/coords.filter";
import { Coords } from "./models/coords.model";

@Module({
    imports: [
        SequelizeModule.forFeature([Coords]),
        DataFilterModule.forFeature({
            filters: [{ filter: CoordsFilter }]
        })
    ],
    controllers: [CoordsController]
})
export class CoordsModule {}
