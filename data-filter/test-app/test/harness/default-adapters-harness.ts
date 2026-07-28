import { INestApplication, ValidationPipe } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/sequelize";
import { Test } from "@nestjs/testing";
import { FilterQueryModel } from "@recursyve/nestjs-data-filter";
import { Sequelize } from "sequelize-typescript";
import request, { Test as SupertestTest } from "supertest";
import { App } from "supertest/types";
import { DefaultAdaptersAppModule } from "../../src/default-adapters-app.module";
import { TestHarness } from "./test-harness";

export class DefaultAdaptersHarness {
    private constructor(public readonly app: INestApplication<App>) {}

    public static async create(): Promise<DefaultAdaptersHarness> {
        const moduleRef = await Test.createTestingModule({
            imports: [DefaultAdaptersAppModule]
        }).compile();

        const app = moduleRef.createNestApplication<INestApplication<App>>();
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();

        const sequelize = app.get<Sequelize>(getConnectionToken());
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
        await sequelize.sync({ force: true });
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        return new DefaultAdaptersHarness(app);
    }

    public async close(): Promise<void> {
        await this.app.close();
    }

    private withDefaultUser(request: SupertestTest, withUser: boolean): SupertestTest {
        if (!withUser) {
            return request;
        }

        return request.set("x-default-user", "1");
    }

    public postFilter(route: string, body: FilterQueryModel, withDefaultUser = false) {
        return this.withDefaultUser(
            request(this.app.getHttpServer()).post(`/${route}/filter`).send(body),
            withDefaultUser
        );
    }

    public async filterIds(route: string, body: FilterQueryModel, withDefaultUser = false): Promise<number[]> {
        const response = await this.postFilter(route, body, withDefaultUser).expect(200);
        return TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response));
    }
}
