import { EnvironmentConfig, SequelizeConfig } from "../decorators/config.decorator";
import { Variable } from "../decorators/variable.decorator";
import { ConfigHandler } from "./config.handler";
import { EnvironmentConfigProvider } from "../providers/environment.config-provider";
import { ConfigMetadata } from "../models/config-metadata.model";
import { VariableMetadata } from "../models/variable-metadata.model";
import { SequelizeConfigProvider } from "../providers/sequelize.config-provider";

@EnvironmentConfig()
class EnvironmentConfigModel {
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

@SequelizeConfig()
class SequelizeConfigModel {
    @Variable("REDIS_HOST")
    redisHost: string;

    @Variable({
        required: false,
    })
    REDIS_PORT: string;

    @Variable
    redisPassword: string;
}

describe("ConfigHandler", () => {
    describe("environment config", () => {
        it("Should return a config with the provider set as environment", () => {
            const config = ConfigHandler.getConfig(EnvironmentConfigModel);
            expect(config).toBeDefined();

            const expected = {
                provider: EnvironmentConfigProvider.type,
                variables: [
                    {
                        propertyKey: "DB_HOST",
                        variableName: "DB_HOST",
                        required: false,
                    } as VariableMetadata,
                    {
                        propertyKey: "dbName",
                        variableName: "DB_NAME",
                        required: false,
                    } as VariableMetadata,
                    {
                        propertyKey: "DB_PORT",
                        variableName: "DB_PORT",
                        required: true,
                    } as VariableMetadata,
                ],
            } as ConfigMetadata;

            expect(config).toEqual(expected);
        });
    });

    describe("sequelize config", () => {
        it("Should return a config with the provider set as environment", () => {
            const config = ConfigHandler.getConfig(SequelizeConfigModel);
            expect(config).toBeDefined();

            const expected = {
                provider: SequelizeConfigProvider.type,
                variables: [
                    {
                        propertyKey: "redisHost",
                        variableName: "REDIS_HOST",
                        required: true,
                    } as VariableMetadata,
                    {
                        propertyKey: "REDIS_PORT",
                        variableName: "REDIS_PORT",
                        required: false,
                    } as VariableMetadata,
                    {
                        propertyKey: "redisPassword",
                        variableName: "redisPassword",
                        required: true,
                    } as VariableMetadata,
                ],
            } as ConfigMetadata;

            expect(config).toEqual(expected);
        });
    });
});
