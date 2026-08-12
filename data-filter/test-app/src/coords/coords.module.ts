import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { CoordsAxisOrderController } from "./controllers/coords-axis-order.controller";
import { CoordsController } from "./controllers/coords.controller";
import { CoordsAxisOrderFilter } from "./filters/coords-axis-order.filter";
import { CoordsFilter } from "./filters/coords.filter";
import { Coords } from "./models/coords.model";

@Module({
    imports: [
        SequelizeModule.forFeature([Coords]),
        DataFilterModule.forFeature({
            filters: [{ filter: CoordsFilter }, { filter: CoordsAxisOrderFilter }]
        })
    ],
    controllers: [CoordsController, CoordsAxisOrderController]
})
export class CoordsModule {}
