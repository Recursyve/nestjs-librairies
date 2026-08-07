import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { GuildChartersController } from "./controllers/guild-charters.controller";
import { GuildChartersFilter } from "./filters/guild-charters.filter";
import { GUILD_REGION_TOKEN } from "./guild-region.token";
import { GuildCharters } from "./models/guild-charters.model";

@Module({
    providers: [
        {
            provide: GUILD_REGION_TOKEN,
            useValue: "north"
        }
    ],
    exports: [GUILD_REGION_TOKEN]
})
class GuildRegionModule {}

@Module({
    imports: [
        SequelizeModule.forFeature([GuildCharters]),
        DataFilterModule.forFeature({
            imports: [GuildRegionModule],
            filters: [
                {
                    filter: GuildChartersFilter,
                    inject: [GUILD_REGION_TOKEN]
                }
            ]
        })
    ],
    controllers: [GuildChartersController]
})
export class GuildChartersModule {}
