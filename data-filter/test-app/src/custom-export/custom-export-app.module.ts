import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import {
    AccessControlAdapter,
    DataFilterModule,
    ExportAdapter,
    TranslateAdapter,
    UserDeserializer
} from "@recursyve/nestjs-data-filter";
import { HarborNoticesController } from "../harbor-notices/controllers/harbor-notices.controller";
import { HarborNoticesFilter } from "../harbor-notices/filters/harbor-notices.filter";
import { HarborNotices } from "../harbor-notices/models/harbor-notices.model";
import { TestAccessControlAdapter } from "../test-access-control/test-access-control.adapter";
import { TestUserDeserializer } from "../test-access-control/test-user.deserializer";
import { TestTranslateAdapter } from "../test-translate/test-translate.adapter";
import { HarborExportProbeController } from "./controllers/harbor-export-probe.controller";
import { HarborExportAdapter } from "./harbor-export.adapter";

/**
 * Mini app characterizing a consumer-provided ExportAdapter, including
 * FilterService.downloadData language / exportOptions forwarding.
 */
@Module({
    imports: [
        DataFilterModule.forRoot({
            filter: { maxPage: 50 },
            accessControlAdapter: {
                provide: AccessControlAdapter,
                useClass: TestAccessControlAdapter
            },
            translateAdapter: {
                provide: TranslateAdapter,
                useClass: TestTranslateAdapter
            },
            deserializer: {
                provide: UserDeserializer,
                useClass: TestUserDeserializer
            },
            exportAdapter: {
                provide: ExportAdapter,
                useClass: HarborExportAdapter
            },
            validateData: false
        }),
        SequelizeModule.forRoot({
            dialect: "mysql",
            host: process.env.DB_HOST ?? "localhost",
            port: Number(process.env.DB_PORT ?? 3306),
            username: process.env.DB_USERNAME ?? "root",
            password: process.env.DB_PASSWORD ?? "root",
            database: process.env.DB_NAME ?? "test",
            autoLoadModels: true,
            synchronize: false,
            logging: false,
            define: {
                timestamps: true,
                paranoid: true,
                updatedAt: "updated_at",
                createdAt: "created_at",
                deletedAt: "deleted_at",
                defaultScope: {
                    attributes: {
                        exclude: ["updated_at", "created_at", "deleted_at"]
                    }
                }
            }
        }),
        SequelizeModule.forFeature([HarborNotices]),
        DataFilterModule.forFeature({
            filters: [{ filter: HarborNoticesFilter }]
        })
    ],
    controllers: [HarborNoticesController, HarborExportProbeController]
})
export class CustomExportAppModule {}
