import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { MemberTiersController } from "./controllers/member-tiers.controller";
import { MemberTiersFilter } from "./filters/member-tiers.filter";
import { MemberTiers } from "./models/member-tiers.model";

@Module({
    imports: [
        SequelizeModule.forFeature([MemberTiers]),
        DataFilterModule.forFeature({
            filters: [{ filter: MemberTiersFilter }]
        })
    ],
    controllers: [MemberTiersController]
})
export class MemberTiersModule {}
