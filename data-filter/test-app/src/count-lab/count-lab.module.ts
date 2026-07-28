import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { CountLabController } from "./controllers/count-lab.controller";
import { CountLabFilter } from "./filters/count-lab.filter";
import { CountLabChildren } from "./models/count-lab-children.model";
import { CountLabParents } from "./models/count-lab-parents.model";

@Module({
    imports: [
        SequelizeModule.forFeature([CountLabParents, CountLabChildren]),
        DataFilterModule.forFeature({
            filters: [{ filter: CountLabFilter }]
        })
    ],
    controllers: [CountLabController]
})
export class CountLabModule {}
