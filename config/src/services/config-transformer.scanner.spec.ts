import { Variable } from "../decorators";
import { ConfigTransformerService } from "./config-transformer.service";
import { VariableScanner } from "../scanners/variable.scanner";

class VariableTest {
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

describe("ConfigTransformerService", () => {
    let configService: ConfigTransformerService;
    let scanner: VariableScanner;

    beforeAll(() => {
        scanner = new VariableScanner();
        configService = new ConfigTransformerService(scanner);
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
            DB_PORT: "4200"
        };

        expect(variables).toEqual(expect.objectContaining(expected));
    });
});
