import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { LocationsController } from "./locations/controllers/locations.controller";
import { LocationsFilter } from "./locations/filters/locations.filter";
import { Locations } from "./locations/models/locations.model";

@Module({
    imports: [
        DataFilterModule.forRoot({}),
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
export class DefaultAdaptersAppModule implements NestModule {
    public configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply((req, _res, next) => {
                if (req.headers["x-default-user"]) {
                    req.user = { id: "default-user" };
                }
                next();
            })
            .forRoutes("*");
    }
}
