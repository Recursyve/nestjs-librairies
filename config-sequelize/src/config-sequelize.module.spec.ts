import { SequelizeModule } from "@nestjs/sequelize";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, ConfigUtils, Variable } from "@recursyve/nestjs-config";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ConfigSequelizeModule } from "./config-sequelize.module";
import { SequelizeConfig } from "./decorators/sequelize-config.decorator";
import { ConfigSequelizeModel, ConfigSequelizeModelInjectionToken } from "./models/config-sequelize.model";
import { SequelizeConfigProvider } from "./providers/sequelize.config-provider";

@SequelizeConfig()
class SequelizeConfigTest {
    @Variable(false)
    public name?: string;
}

describe(ConfigSequelizeModule, () => {
    describe("forRoot", () => {
        it("returns a global module that exports SequelizeConfigProvider", () => {
            expect.assertions(4);

            const dynamicModule = ConfigSequelizeModule.forRoot();

            expect(dynamicModule.global).toBe(true);
            expect(dynamicModule.module).toBe(ConfigSequelizeModule);
            expect(dynamicModule.providers).toContain(SequelizeConfigProvider);
            expect(dynamicModule.exports).toContain(SequelizeConfigProvider);
        });
    });

    describe("when the custom table name is not provided", () => {
        let moduleRef: TestingModule;

        beforeEach(async () => {
            moduleRef = await Test.createTestingModule({
                imports: [
                    SequelizeModule.forRoot({
                        dialect: "sqlite",
                        storage: ":memory:",
                        autoLoadModels: true
                    }),
                    ConfigModule.forRoot(SequelizeConfigTest),
                    ConfigSequelizeModule.forRoot()
                ]
            }).compile();
            await moduleRef.init();
        });

        afterEach(async () => {
            await moduleRef.close();
        });

        it("provides the config class from ConfigModule", () => {
            expect.assertions(2);

            const config = moduleRef.get<SequelizeConfigTest>(ConfigUtils.getProviderToken(SequelizeConfigTest));

            expect(config).toBeDefined();
            expect(config).toBeInstanceOf(SequelizeConfigTest);
        });
    });

    describe("when the custom table name is provided", () => {
        let moduleRef: TestingModule;

        beforeEach(async () => {
            moduleRef = await Test.createTestingModule({
                imports: [
                    SequelizeModule.forRoot({
                        dialect: "sqlite",
                        storage: ":memory:",
                        autoLoadModels: true
                    }),
                    ConfigModule.forRoot(SequelizeConfigTest),
                    ConfigSequelizeModule.forRoot({ tableName: "my_custom_table_name" })
                ]
            }).compile();
            await moduleRef.init();
        });

        afterEach(async () => {
            await moduleRef.close();
        });

        it("registers the config repository with the custom table name", () => {
            expect.assertions(3);

            const config = moduleRef.get<SequelizeConfigTest>(ConfigUtils.getProviderToken(SequelizeConfigTest));

            expect(config).toBeDefined();
            expect(config).toBeInstanceOf(SequelizeConfigTest);

            const repository = moduleRef.get<typeof ConfigSequelizeModel>(ConfigSequelizeModelInjectionToken);

            expect(repository.tableName).toBe("my_custom_table_name");
        });
    });
});
