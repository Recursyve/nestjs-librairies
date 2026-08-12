import { Inject, Injectable, Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import {
    DataFilterModule,
    TranslateAdapter
} from "@recursyve/nestjs-data-filter";
import { LocationsController } from "./locations/controllers/locations.controller";
import { LocationsFilter } from "./locations/filters/locations.filter";
import { Locations } from "./locations/models/locations.model";

export const FOR_ROOT_MARKER = "FOR_ROOT_MARKER";

@Module({
    providers: [{ provide: FOR_ROOT_MARKER, useValue: "root-import" }],
    exports: [FOR_ROOT_MARKER]
})
class ForRootMarkerModule {}

/**
 * TranslateAdapter that proves DataFilterModule.forRoot({ imports }) makes
 * imported providers injectable into root-level adapter providers.
 */
@Injectable()
class ForRootMarkerTranslateAdapter extends TranslateAdapter {
    constructor(@Inject(FOR_ROOT_MARKER) private readonly marker: string) {
        super();
    }

    public getTranslation(_lang: string, key: string): Promise<string> {
        return Promise.resolve(`${this.marker}:${key}`);
    }
}

@Module({
    imports: [
        DataFilterModule.forRoot({
            imports: [ForRootMarkerModule],
            translateAdapter: {
                provide: TranslateAdapter,
                useClass: ForRootMarkerTranslateAdapter
            }
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
export class ForRootImportsAppModule {}
