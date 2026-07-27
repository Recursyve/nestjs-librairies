import { INestApplication, ValidationPipe } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/sequelize";
import { Test } from "@nestjs/testing";
import { FilterQueryModel, FilterResultModel } from "@recursyve/nestjs-data-filter";
import { Sequelize } from "sequelize-typescript";
import request from "supertest";
import { AppModule } from "../../src/app.module";

export class TestHarness {
    public static defaultPage = { number: 0, size: 20 };

    private constructor(public readonly app: INestApplication) {}

    public static async create(): Promise<TestHarness> {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();

        const app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();

        const sequelize = app.get<Sequelize>(getConnectionToken());
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
        await sequelize.sync({ force: true });
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        return new TestHarness(app);
    }

    public async close(): Promise<void> {
        await this.app.close();
    }

    public postFilter<T>(route: string, body: FilterQueryModel) {
        return request(this.app.getHttpServer()).post(`/${route}/filter`).send(body);
    }

    public postFilterCount(route: string, body: FilterQueryModel) {
        return request(this.app.getHttpServer()).post(`/${route}/filter-count`).send(body);
    }

    public postDownload(route: string, type: string, body: FilterQueryModel) {
        return request(this.app.getHttpServer()).post(`/${route}/download/${type}`).send(body);
    }

    public parseCountBody(response: { status: number; text: string }): number {
        return Number(response.text);
    }

    public getFilterConfig(route: string) {
        return request(this.app.getHttpServer()).get(`/${route}/filter/config`);
    }

    public getFilterConfigValue(route: string, query: Record<string, string>) {
        return request(this.app.getHttpServer()).get(`/${route}/filter/config/value`).query(query);
    }

    public getFilterConfigId(route: string, query: Record<string, string>) {
        return request(this.app.getHttpServer()).get(`/${route}/filter/config/id`).query(query);
    }

    public async filterIds(route: string, body: FilterQueryModel): Promise<number[]> {
        const response = await this.postFilter<unknown>(route, body).expect(200);
        const payload = response.body as FilterResultModel<{ id: number }>;
        return payload.values.map((row) => row.id);
    }
}
