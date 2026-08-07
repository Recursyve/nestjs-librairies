import { INestApplication, ValidationPipe } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/sequelize";
import { Test } from "@nestjs/testing";
import { FilterQueryModel } from "@recursyve/nestjs-data-filter";
import { Sequelize } from "sequelize-typescript";
import request from "supertest";
import { App } from "supertest/types";
import { AclBypassAppModule } from "../../src/acl-bypass-app/acl-bypass-app.module";
import { TestAccessControlUser } from "../../src/test-access-control/test-access-control-user.model";
import { TestHarness } from "./test-harness";

export class AclBypassHarness {
    private constructor(public readonly app: INestApplication<App>) {}

    public static async create(): Promise<AclBypassHarness> {
        const moduleRef = await Test.createTestingModule({
            imports: [AclBypassAppModule]
        }).compile();

        const app = moduleRef.createNestApplication<INestApplication<App>>();
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();

        const sequelize = app.get<Sequelize>(getConnectionToken());
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
        await sequelize.sync({ force: true });
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        return new AclBypassHarness(app);
    }

    public async close(): Promise<void> {
        await this.app.close();
    }

    public postFilter(route: string, body: FilterQueryModel, user?: TestAccessControlUser) {
        const req = request(this.app.getHttpServer()).post(`/${route}/filter`).send(body);
        if (user) {
            return req.set("x-test-user", JSON.stringify(user));
        }
        return req;
    }

    public async filterIds(route: string, body: FilterQueryModel, user?: TestAccessControlUser): Promise<number[]> {
        const response = await this.postFilter(route, body, user).expect(200);
        return TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response));
    }
}
