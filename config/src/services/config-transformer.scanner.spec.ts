import { Variable } from "../decorators/variable.decorator";
import { ConfigTransformerService } from "./config-transformer.service";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "../config.module";
import { Config, EnvironmentConfig, SequelizeConfig } from "../decorators";
import { ConfigSequelizeModel, ConfigSequelizeModelInjectionToken } from "../models/config-sequelize.model";
import { SequelizeModule } from "@nestjs/sequelize";
import { ConfigSequelizeModule } from "../config-sequelize.module";
import { ConfigProviderNotRegisteredError } from "../errors/config-provider-not-registered.error";
import { ConfigVariablesNotDefinedError } from "../errors/config-variables-not-defined.error";

@EnvironmentConfig()
class EnvironmentConfigModel {
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

class DefaultConfigModel {
    @Variable("FIRST_VAR")
    firstVar: string;

    @Variable(true)
    secondVar: string;

    @Variable
    THIRD_VAR: string;
}

@SequelizeConfig()
class SequelizeConfigModel {
    @Variable("SEQUELIZE_FIRST_VAR")
    firstVar: string;

    @Variable
    SEQUELIZE_SECOND_VAR: string;

    @Variable(true)
    sequelizeThirdVar: string;
}

@Config({ provider: "unknown" })
class UnknownProviderConfigModel {
    @Variable("UNKNOWN_VAR")
    var: string;
}

class RequiredVariableEnvTest {
    @Variable(true)
    firstVar: string;

    @Variable
    secondVar: string;
}

describe("ConfigTransformerService", () => {
    describe("transform", () => {
        let moduleRef: TestingModule;
        let configService: ConfigTransformerService;

        const oldEnv = process.env;

        beforeAll(async () => {
            moduleRef = await Test.createTestingModule({
                imports: [
                    SequelizeModule.forRoot({
                        dialect: "sqlite",
                        storage: ":memory:",
                        autoLoadModels: true
                    }),
                    ConfigModule.forRoot(),
                    ConfigSequelizeModule.forRoot()
                ]
            }).compile();
            await moduleRef.init();

            configService = moduleRef.get(ConfigTransformerService);
        });

        beforeEach(() => {
            process.env = { ...oldEnv };
        });

        it("transform should return the config from the environment for an environment config", async () => {
            process.env["DB_HOST"] = "127.0.0.1";
            process.env["DB_NAME"] = "test";
            process.env["DB_PORT"] = "4200";

            const config = await configService.transform(EnvironmentConfigModel);

            expect(config).toBeDefined();
            expect(config).toBeInstanceOf(EnvironmentConfigModel);
            expect(config).toEqual({
                DB_HOST: "127.0.0.1",
                dbName: "test",
                DB_PORT: "4200"
            });
        });

        it("transform should return the config from the environment if no provider is specified", async () => {
            process.env["FIRST_VAR"] = "a";
            process.env["secondVar"] = "b";
            process.env["THIRD_VAR"] = "c";

            const config = await configService.transform(DefaultConfigModel);

            expect(config).toBeDefined();
            expect(config).toBeInstanceOf(DefaultConfigModel);
            expect(config).toEqual({
                firstVar: "a",
                secondVar: "b",
                THIRD_VAR: "c"
            });
        });

        it("transform should return the config from sequelize if the provider is sequelize", async () => {
            const repository = moduleRef.get<typeof ConfigSequelizeModel>(ConfigSequelizeModelInjectionToken);
            await repository.bulkCreate([
                { key: "SEQUELIZE_FIRST_VAR", value: "sequelize_first_value" },
                { key: "SEQUELIZE_SECOND_VAR", value: "sequelize_second_value" },
                { key: "sequelizeThirdVar", value: "sequelize_third_value" }
            ]);

            const config = await configService.transform(SequelizeConfigModel);

            expect(config).toBeDefined();
            expect(config).toBeInstanceOf(SequelizeConfigModel);
            expect(config).toEqual({
                firstVar: "sequelize_first_value",
                SEQUELIZE_SECOND_VAR: "sequelize_second_value",
                sequelizeThirdVar: "sequelize_third_value"
            });
        });

        it("should throw an exception if the provider is not found", async () => {
            await expect(configService.transform(UnknownProviderConfigModel)).rejects.toThrow(
                ConfigProviderNotRegisteredError
            );
        });

        it("should throw an exception if a required variable is not defined", async () => {
            await expect(configService.transform(EnvironmentConfigModel)).rejects.toThrow(
                ConfigVariablesNotDefinedError
            );

            process.env["DB_HOST"] = "127.0.0.1";
            await expect(configService.transform(EnvironmentConfigModel)).rejects.toThrow(
                ConfigVariablesNotDefinedError
            );

            process.env["DB_PORT"] = "1234";
            await expect(configService.transform(EnvironmentConfigModel)).resolves.toEqual({
                DB_HOST: "127.0.0.1",
                DB_PORT: "1234"
            });
        });
    });

    describe("skip required validation", () => {
        it("should not throw if requirement validation is disabled", async () => {
            const moduleWithoutValidation = await Test.createTestingModule({
                imports: [ConfigModule.forRoot({ skipRequiredFieldsCheck: true })]
            }).compile();
            await moduleWithoutValidation.init();

            const configService = moduleWithoutValidation.get(ConfigTransformerService);
            await expect(configService.transform(RequiredVariableEnvTest)).resolves.toEqual({});
        });
    });
});
