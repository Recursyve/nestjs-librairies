import { Config, Variable } from "../decorators";
import { VariableModel } from "../models/variable.model";
import { ConfigHandler } from "./config.handler";
import { EnvironmentConfigProvider } from "../providers/environment.config-provider";
import { ConfigModel } from "../models/config.model";

@Config({ provider: EnvironmentConfigProvider })
class EnvVariableTest {
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

describe("VariableScanner", () => {
    it("getVariables should return the valid VariableConfig array", () => {
        const config = ConfigHandler.getConfig(EnvVariableTest);
        expect(config).toBeDefined();

        const expected = {
            provider: EnvironmentConfigProvider,
            variables: [
                {
                    propertyKey: "DB_HOST",
                    variableName: "DB_HOST",
                    required: false
                } as VariableModel,

                {
                    propertyKey: "dbName",
                    variableName: "DB_NAME",
                    required: false
                } as VariableModel,

                {
                    propertyKey: "DB_PORT",
                    variableName: "DB_PORT",
                    required: true
                } as VariableModel
            ]
        } as ConfigModel;

        expect(config).toEqual(expected);
    });
});
