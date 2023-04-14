import { Test } from "@nestjs/testing";
import { ConfigModule } from "./config.module";
import { ConfigUtils } from "./config.utils";
import { Variable } from "./decorators";

class VariableEnvTest {
    @Variable(false)
    DB_HOST: string;

    @Variable({
        variableName: "DB_NAME",
        required: false
    })
    dbName: string;

    @Variable
    DB_PORT: string;
}

describe("ConfigModule", () => {
    let config: VariableEnvTest;

    beforeAll(async () => {
        process.env["DB_HOST"] = "127.0.0.1";
        process.env["DB_NAME"] = "test";
        process.env["DB_PORT"] = "4200";

        const moduleRef = await Test.createTestingModule({
            imports: [ConfigModule.forRoot(VariableEnvTest)]
        }).compile();
        await moduleRef.init();

        config = moduleRef.get<VariableEnvTest>(ConfigUtils.getProviderToken(VariableEnvTest));
    });

    it("config should contains valid environment variables", async () => {
        const expected = {
            DB_HOST: "127.0.0.1",
            dbName: "test",
            DB_PORT: "4200"
        };

        expect(config).toEqual(expect.objectContaining(expected));
    });
});
