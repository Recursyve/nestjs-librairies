import { Variable } from "../decorators/variable.decorator";
import { ConfigTransformerService } from "./config-transformer.service";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "../config.module";
import { EnvironmentConfig } from "../decorators";

@EnvironmentConfig()
class VariableTest {
    @Variable(false)
    DB_HOST: string;

    @Variable({
        variableName: "DB_NAME",
        required: false,
    })
    dbName: string;

    @Variable
    DB_PORT: string;
}

describe("ConfigTransformerService", () => {
    let module: TestingModule;

    let configService: ConfigTransformerService;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigModule.forRoot(VariableTest)],
        }).compile();
        await module.init();

        configService = module.get(ConfigTransformerService);

        process.env["DB_HOST"] = "127.0.0.1";
        process.env["DB_NAME"] = "test";
        process.env["DB_PORT"] = "4200";
    });

    it("getVariables should return the valid VariableConfig array", () => {
        const variables = configService.transform(VariableTest);
        expect(variables).toBeDefined();
        const expected = {
            DB_HOST: "127.0.0.1",
            dbName: "test",
            DB_PORT: "4200",
        };

        expect(variables).toEqual(expect.objectContaining(expected));
    });
});
