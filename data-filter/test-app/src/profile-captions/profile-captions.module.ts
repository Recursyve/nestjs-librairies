import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { ProfileCaptionsController } from "./controllers/profile-captions.controller";
import { ProfileCaptionsFilter } from "./filters/profile-captions.filter";
import { ProfileCaptions } from "./models/profile-captions.model";

@Module({
    imports: [
        SequelizeModule.forFeature([ProfileCaptions]),
        DataFilterModule.forFeature({
            filters: [{ filter: ProfileCaptionsFilter }]
        })
    ],
    controllers: [ProfileCaptionsController]
})
export class ProfileCaptionsModule {}
