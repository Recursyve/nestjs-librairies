import { INestApplication, ValidationPipe } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/sequelize";
import { Test } from "@nestjs/testing";
import { FilterQueryModel } from "@recursyve/nestjs-data-filter";
import { Sequelize } from "sequelize-typescript";
import request from "supertest";
import { App } from "supertest/types";
import { CustomExportAppModule } from "../../src/custom-export/custom-export-app.module";
import { TestHarness } from "./test-harness";

export class CustomExportHarness {
    private constructor(public readonly app: INestApplication<App>) {}

    public static async create(): Promise<CustomExportHarness> {
        const moduleRef = await Test.createTestingModule({
            imports: [CustomExportAppModule]
        }).compile();

        const app = moduleRef.createNestApplication<INestApplication<App>>();
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();

        const sequelize = app.get<Sequelize>(getConnectionToken());
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
        await sequelize.sync({ force: true });
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        return new CustomExportHarness(app);
    }

    public async close(): Promise<void> {
        await this.app.close();
    }

    public postDownload(route: string, type: string, body: FilterQueryModel) {
        return request(this.app.getHttpServer()).post(`/${route}/download/${type}`).send(body);
    }

    public postDownloadBinary(route: string, type: string, body: FilterQueryModel) {
        return request(this.app.getHttpServer())
            .post(`/${route}/download/${type}`)
            .buffer(true)
            .parse((response, callback) => {
                const chunks: Buffer[] = [];
                response.on("data", (chunk: Buffer) => chunks.push(chunk));
                response.on("end", () => callback(null, Buffer.concat(chunks)));
            })
            .send(body);
    }

    public postFilter(route: string, body: FilterQueryModel) {
        return request(this.app.getHttpServer()).post(`/${route}/filter`).send(body);
    }

    public async filterIds(route: string, body: FilterQueryModel): Promise<number[]> {
        const response = await this.postFilter(route, body).expect(200);
        return TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response));
    }
}
