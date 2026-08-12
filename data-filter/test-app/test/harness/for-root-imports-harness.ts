import { INestApplication, ValidationPipe } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/sequelize";
import { Test } from "@nestjs/testing";
import { Sequelize } from "sequelize-typescript";
import request from "supertest";
import { App } from "supertest/types";
import { ForRootImportsAppModule } from "../../src/for-root-imports-app.module";

export class ForRootImportsHarness {
    private constructor(public readonly app: INestApplication<App>) {}

    public static async create(): Promise<ForRootImportsHarness> {
        const moduleRef = await Test.createTestingModule({
            imports: [ForRootImportsAppModule]
        }).compile();

        const app = moduleRef.createNestApplication<INestApplication<App>>();
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();

        const sequelize = app.get<Sequelize>(getConnectionToken());
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
        await sequelize.sync({ force: true });
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        return new ForRootImportsHarness(app);
    }

    public async close(): Promise<void> {
        await this.app.close();
    }

    public getFilterConfig(route: string) {
        return request(this.app.getHttpServer()).get(`/${route}/filter/config`);
    }
}
