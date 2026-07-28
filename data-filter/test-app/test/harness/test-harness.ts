import { INestApplication, ValidationPipe } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/sequelize";
import { Test } from "@nestjs/testing";
import { FilterConfigurationModel, FilterQueryModel, FilterResultModel } from "@recursyve/nestjs-data-filter";
import { Sequelize } from "sequelize-typescript";
import request, { Test as SupertestTest } from "supertest";
import { App } from "supertest/types";
import { expect } from "vitest";
import { AppModule } from "../../src/app.module";
import { TestAccessControlUser } from "../../src/test-access-control/test-access-control-user.model";

export class TestHarness {
    public static defaultPage = { number: 0, size: 20 };

    private constructor(public readonly app: INestApplication<App>) {}

    public static async create(options?: { validateData?: boolean }): Promise<TestHarness> {
        let moduleBuilder = Test.createTestingModule({
            imports: [AppModule]
        });

        if (options?.validateData) {
            moduleBuilder = moduleBuilder.overrideProvider("__VALIDATE_DATA__").useValue(true);
        }

        const moduleRef = await moduleBuilder.compile();

        const sequelize = moduleRef.get<Sequelize>(getConnectionToken());
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
        await sequelize.sync({ force: true });
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        const app = moduleRef.createNestApplication<INestApplication<App>>();
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();

        return new TestHarness(app);
    }

    public async close(): Promise<void> {
        await this.app.close();
    }

    private withUser(request: SupertestTest, user?: TestAccessControlUser | null): SupertestTest {
        if (user === undefined || user === null) {
            return request;
        }

        return request.set("x-test-user", JSON.stringify(user));
    }

    public postFilter(route: string, body: FilterQueryModel, user?: TestAccessControlUser | null) {
        return this.withUser(request(this.app.getHttpServer()).post(`/${route}/filter`).send(body), user);
    }

    public postFilterCount(route: string, body: FilterQueryModel, user?: TestAccessControlUser | null) {
        return this.withUser(request(this.app.getHttpServer()).post(`/${route}/filter-count`).send(body), user);
    }

    public postDownload(route: string, type: string, body: FilterQueryModel, user?: TestAccessControlUser | null) {
        return this.withUser(request(this.app.getHttpServer()).post(`/${route}/download/${type}`).send(body), user);
    }

    public postDownloadBinary(
        route: string,
        type: string,
        body: FilterQueryModel,
        user?: TestAccessControlUser | null
    ) {
        return this.withUser(
            request(this.app.getHttpServer())
                .post(`/${route}/download/${type}`)
                .buffer(true)
                .parse((response, callback) => {
                    const chunks: Buffer[] = [];
                    response.on("data", (chunk: Buffer) => chunks.push(chunk));
                    response.on("end", () => callback(null, Buffer.concat(chunks)));
                })
                .send(body),
            user
        );
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

    public getFilterConfig(route: string, user?: TestAccessControlUser | null) {
        return this.withUser(request(this.app.getHttpServer()).get(`/${route}/filter/config`), user);
    }

    public getFilterConfigValue(route: string, query: Record<string, string>, user?: TestAccessControlUser | null) {
        return this.withUser(request(this.app.getHttpServer()).get(`/${route}/filter/config/value`).query(query), user);
    }

    public getFilterConfigId(route: string, query: Record<string, string>, user?: TestAccessControlUser | null) {
        return this.withUser(request(this.app.getHttpServer()).get(`/${route}/filter/config/id`).query(query), user);
    }

    public async filterIds(
        route: string,
        body: FilterQueryModel,
        user?: TestAccessControlUser | null
    ): Promise<number[]> {
        const response = await this.postFilter(route, body, user).expect(200);
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
