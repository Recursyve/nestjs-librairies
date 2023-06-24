import { Test, TestingModule } from "@nestjs/testing";
import { ConfigTransformerService } from "@recursyve/nestjs-config/services/config-transformer.service";
import { ConfigSequelizeModule } from "../config-sequelize.module";
import { ConfigMetadata, ConfigModule, Variable } from "@recursyve/nestjs-config";
import { SequelizeModule } from "@nestjs/sequelize";
import { ConfigSequelizeModel, ConfigSequelizeModelInjectionToken, SequelizeConfigManager } from "../models";
import { SequelizeConfig } from "../decorators";
import { ConfigHandler } from "@recursyve/nestjs-config/handlers/config.handler";
import { SequelizeConfigProvider } from "./sequelize.config-provider";
import { VariableMetadata } from "@recursyve/nestjs-config/models/variable-metadata.model";
import { Type } from "class-transformer";

@SequelizeConfig()
class SequelizeConfigModel1 {
    @Variable("REDIS_HOST")
    redisHost: string;

    @Variable({
        required: false
    })
    REDIS_PORT: string;

    @Variable
    redisPassword: string;
}

@SequelizeConfig()
class ManageableSequelizeConfig extends SequelizeConfigManager<ManageableSequelizeConfig> {
    @Variable
    first: string;

    @Variable
    @Type(() => Number)
    second: number;
}

@SequelizeConfig()
class SequelizeConfigModel2 {
    @Variable("SEQUELIZE_FIRST_VAR")
    firstVar: string;

    @Variable
    SEQUELIZE_SECOND_VAR: string;

    @Variable(true)
    sequelizeThirdVar: string;
}

describe("SequelizeConfigProvider", () => {
    let moduleRef: TestingModule;
    let configService: ConfigTransformerService;

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

    beforeEach(async () => {
        const repository = moduleRef.get<typeof ConfigSequelizeModel>(ConfigSequelizeModelInjectionToken);
        await repository.destroy({ where: {} });
    });

    it("Should return a config with the provider set as environment", () => {
        const config = ConfigHandler.getConfig(SequelizeConfigModel1);
        expect(config).toBeDefined();

        const expected = {
            provider: SequelizeConfigProvider.type,
            variables: [
                {
                    propertyKey: "redisHost",
                    variableName: "REDIS_HOST",
                    required: true
                } as VariableMetadata,
                {
                    propertyKey: "REDIS_PORT",
                    variableName: "REDIS_PORT",
                    required: false
                } as VariableMetadata,
                {
                    propertyKey: "redisPassword",
                    variableName: "redisPassword",
                    required: true
                } as VariableMetadata
            ]
        } as ConfigMetadata;

        expect(config).toEqual(expected);
    });

    it("transform should return the config from sequelize if the provider is sequelize", async () => {
        const repository = moduleRef.get<typeof ConfigSequelizeModel>(ConfigSequelizeModelInjectionToken);
        await repository.bulkCreate([
            { key: "SEQUELIZE_FIRST_VAR", value: "sequelize_first_value" },
            { key: "SEQUELIZE_SECOND_VAR", value: "sequelize_second_value" },
            { key: "sequelizeThirdVar", value: "sequelize_third_value" }
        ]);

        const config = await configService.transform(SequelizeConfigModel2);

        expect(config).toBeDefined();
        expect(config).toBeInstanceOf(SequelizeConfigModel2);
        expect(config).toEqual({
            firstVar: "sequelize_first_value",
            SEQUELIZE_SECOND_VAR: "sequelize_second_value",
            sequelizeThirdVar: "sequelize_third_value"
        });
    });

    it("should reload the config", async () => {
        const repository = moduleRef.get<typeof ConfigSequelizeModel>(ConfigSequelizeModelInjectionToken);
        await repository.bulkCreate([
            { key: "first", value: "first_value" },
            { key: "second", value: "42" }
        ]);

        const config = await configService.transform(ManageableSequelizeConfig);

        expect(config).toBeDefined();
        expect(config).toBeInstanceOf(ManageableSequelizeConfig);
        expect(config).toMatchObject({
            first: "first_value",
            second: 42
        });

        await repository.update({ value: "updated_first_value" }, { where: { key: "first" } });

        await config.reload();

        expect(config).toBeDefined();
        expect(config).toBeInstanceOf(ManageableSequelizeConfig);
        expect(config).toMatchObject({
            first: "updated_first_value",
            second: 42
        });

        await repository.update({ value: "re_updated_first_value" }, { where: { key: "first" } });
        await repository.update({ value: 1024 }, { where: { key: "second" } });

        await config.reload();

        expect(config).toBeDefined();
        expect(config).toBeInstanceOf(ManageableSequelizeConfig);
        expect(config).toMatchObject({
            first: "re_updated_first_value",
            second: 1024
        });
    });

    it("should update the config", async () => {
        const repository = moduleRef.get<typeof ConfigSequelizeModel>(ConfigSequelizeModelInjectionToken);
        await repository.bulkCreate([
            { key: "first", value: "first_value" },
            { key: "second", value: "42" }
        ]);

        const config = await configService.transform(ManageableSequelizeConfig);

        expect(config).toBeDefined();
        expect(config).toBeInstanceOf(ManageableSequelizeConfig);
        expect(config).toMatchObject({
            first: "first_value",
            second: 42
        });

        await config.update({
            first: "updated_first_value"
        });

        expect(config).toBeDefined();
        expect(config).toBeInstanceOf(ManageableSequelizeConfig);
        expect(config).toMatchObject({
            first: "updated_first_value",
            second: 42
        });

        await config.update({
            first: "re_updated_first_value",
            second: 2048
        });

        expect(config).toBeDefined();
        expect(config).toBeInstanceOf(ManageableSequelizeConfig);
        expect(config).toMatchObject({
            first: "re_updated_first_value",
            second: 2048
        });
    });
});
