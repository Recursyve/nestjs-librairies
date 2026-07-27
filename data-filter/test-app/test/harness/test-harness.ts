import { INestApplication, ValidationPipe } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/sequelize";
import { Test } from "@nestjs/testing";
import { FilterConfigurationModel, FilterQueryModel, FilterResultModel } from "@recursyve/nestjs-data-filter";
import { Sequelize } from "sequelize-typescript";
import request from "supertest";
import { App } from "supertest/types";
import { expect } from "vitest";
import { AppModule } from "../../src/app.module";

export class TestHarness {
    public static defaultPage = { number: 0, size: 20 };

    private constructor(public readonly app: INestApplication<App>) {}

    public static async create(): Promise<TestHarness> {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();

        const app = moduleRef.createNestApplication<INestApplication<App>>();
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

    public postFilter(route: string, body: FilterQueryModel) {
        return request(this.app.getHttpServer()).post(`/${route}/filter`).send(body);
    }

    public postFilterCount(route: string, body: FilterQueryModel) {
        return request(this.app.getHttpServer()).post(`/${route}/filter-count`).send(body);
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

    public parseCountBody(response: { status: number; text: string }): number {
        return Number(response.text);
    }

    public static parseFilterBody<T>(response: { body: unknown }): FilterResultModel<T> {
        return response.body as FilterResultModel<T>;
    }

    public static mapFilterRowIds<T extends { id: number }>(body: FilterResultModel<T>): number[] {
        return body.values.map((row) => row.id);
    }

    public static parseValidationMessage(response: { body: unknown }): string {
        const body = response.body as { message: string | string[] };
        return Array.isArray(body.message) ? body.message.join(" ") : body.message;
    }

    public static parseFilterConfig(response: { body: unknown }): FilterConfigurationModel[] {
        return response.body as FilterConfigurationModel[];
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
        const response = await this.postFilter(route, body).expect(200);
        return TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response));
    }

    public static expectInternalServerErrorFilterResponse(response: { status: number; body: unknown }): void {
        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            statusCode: 500,
            message: "Internal server error"
        });
    }

    public static parseCsv(text: string): string[][] {
        return text
            .trim()
            .split("\n")
            .map((line) => line.split(","));
    }

    public static parseXlsx(buffer: Buffer): string[][] {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const XLSX = require("xlsx") as typeof import("xlsx");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" });
    }
}
