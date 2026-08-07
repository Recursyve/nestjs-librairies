import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import {
    AccessControlAdapter,
    DataFilterModule,
    TranslateAdapter,
    UserDeserializer
} from "@recursyve/nestjs-data-filter";
import { LocationsController } from "../locations/controllers/locations.controller";
import { LocationsFilter } from "../locations/filters/locations.filter";
import { Locations } from "../locations/models/locations.model";
import { TestAccessControlAdapter } from "../test-access-control/test-access-control.adapter";
import { TestUserDeserializer } from "../test-access-control/test-user.deserializer";
import { TestTranslateAdapter } from "../test-translate/test-translate.adapter";

/**
 * Characterizes global filter.disableAccessControl: even when a user is present
 * and the default ACL would restrict, deserialization is skipped and all rows
 * remain visible.
 */
@Module({
    imports: [
        DataFilterModule.forRoot({
            filter: { maxPage: 50, disableAccessControl: true },
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
        SequelizeModule.forFeature([Locations]),
        DataFilterModule.forFeature({
            filters: [{ filter: LocationsFilter }]
        })
    ],
    controllers: [LocationsController]
})
export class AclBypassAppModule implements NestModule {
    public configure(_consumer: MiddlewareConsumer): void {}
}
