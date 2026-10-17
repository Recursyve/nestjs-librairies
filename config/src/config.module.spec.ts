import { Test, TestingModule } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { ConfigModule } from "./config.module";
import { ConfigUtils } from "./config.utils";
import { Variable } from "./decorators/variable.decorator";

class VariableEnvTest {
    @Variable(false)
    public DB_HOST!: string;

    @Variable({
        variableName: "DB_NAME",
        required: false
    })
    public dbName?: string;

    @Variable
    public DB_PORT!: string;
}

class FeatureEnvTest {
    @Variable(false)
    public FEATURE_FLAG!: string;
}

describe(ConfigModule, () => {
    let moduleRef: TestingModule;

    beforeAll(async () => {
        process.env["DB_HOST"] = "127.0.0.1";
        process.env["DB_NAME"] = "test";
        process.env["DB_PORT"] = "4200";

        moduleRef = await Test.createTestingModule({
            imports: [ConfigModule.forRoot(VariableEnvTest)]
        }).compile();

        await moduleRef.init();
    });

    it("config should contains valid environment variables", () => {
        expect.assertions(1);

        const config = moduleRef.get<VariableEnvTest>(ConfigUtils.getProviderToken(VariableEnvTest));

        expect(config).toMatchObject({
            DB_HOST: "127.0.0.1",
            dbName: "test",
            DB_PORT: "4200"
        });
    });

    it("forRoot accepts an options object with configs", async () => {
        expect.assertions(1);

        const optionsModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ configs: [VariableEnvTest] })]
        }).compile();
        await optionsModule.init();

        const config = optionsModule.get<VariableEnvTest>(ConfigUtils.getProviderToken(VariableEnvTest));

        expect(config).toMatchObject({
            DB_HOST: "127.0.0.1",
            dbName: "test",
            DB_PORT: "4200"
        });
    });

    describe("forFeature", () => {
        it("registers and resolves feature config providers", async () => {
            expect.assertions(1);

            process.env["FEATURE_FLAG"] = "on";

            const featureModule = await Test.createTestingModule({
                imports: [ConfigModule.forRoot(), ConfigModule.forFeature(FeatureEnvTest)]
            }).compile();
            await featureModule.init();

            const config = featureModule.get<FeatureEnvTest>(ConfigUtils.getProviderToken(FeatureEnvTest));

            expect(config).toMatchObject({ FEATURE_FLAG: "on" });
        });
    });
});
