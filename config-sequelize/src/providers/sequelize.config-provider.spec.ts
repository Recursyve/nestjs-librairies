import { SequelizeModule } from "@nestjs/sequelize";
import { Test, TestingModule } from "@nestjs/testing";
import type { ConfigMetadata } from "@recursyve/nestjs-config";
import { ConfigHandler, ConfigModule, ConfigTransformerService, Variable } from "@recursyve/nestjs-config";
import { Type } from "class-transformer";
import { afterEach, assert, beforeEach, describe, expect, it } from "vitest";

import { ConfigSequelizeModule } from "../config-sequelize.module";
import { SequelizeConfig } from "../decorators/sequelize-config.decorator";
import { ConfigSequelizeModelInjectionToken, ConfigSequelizeModel } from "../models/config-sequelize.model";
import { ManageableSequelizeConfig } from "../models/manageable-sequelize-config.model";
import { SequelizeConfigProvider } from "./sequelize.config-provider";

@SequelizeConfig()
class RedisSequelizeConfig {
    @Variable("REDIS_HOST")
    public redisHost!: string;

    @Variable({
        required: false
    })
    public REDIS_PORT?: string;

    @Variable
    public redisPassword!: string;
}

@SequelizeConfig()
class EditableSequelizeConfig extends ManageableSequelizeConfig<EditableSequelizeConfig> {
    @Variable
    public first!: string;

    @Variable
    @Type(() => Number)
    public second!: number;

    @Variable("not_three")
    public three!: string;
}

@SequelizeConfig()
class PersistedVariablesSequelizeConfig {
    @Variable("SEQUELIZE_FIRST_VAR")
    public firstVar!: string;

    @Variable
    public SEQUELIZE_SECOND_VAR!: string;

    @Variable(true)
    public sequelizeThirdVar!: string;
}

describe(SequelizeConfigProvider, () => {
    let moduleRef: TestingModule;
    let configService: ConfigTransformerService;
    let sequelizeConfigProvider: SequelizeConfigProvider;

    beforeEach(async () => {
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
        sequelizeConfigProvider = moduleRef.get(SequelizeConfigProvider);

        const repository = moduleRef.get<typeof ConfigSequelizeModel>(ConfigSequelizeModelInjectionToken);
        await repository.destroy({ where: {} });
    });

    afterEach(async () => {
        await moduleRef.close();
    });

    it("returns config metadata with the sequelize provider", () => {
        expect.assertions(1);

        const config = ConfigHandler.getConfig(RedisSequelizeConfig);

        const expected: ConfigMetadata = {
            provider: SequelizeConfigProvider.type,
            variables: [
                {
                    propertyKey: "redisHost",
                    variableName: "REDIS_HOST",
                    required: true
                },
                {
                    propertyKey: "REDIS_PORT",
                    variableName: "REDIS_PORT",
                    required: false
                },
                {
                    propertyKey: "redisPassword",
                    variableName: "redisPassword",
                    required: true
                }
            ]
        };

        expect(config).toStrictEqual(expected);
    });

    it("reads a single value from the configs table", async () => {
        expect.assertions(2);

        const repository = moduleRef.get<typeof ConfigSequelizeModel>(ConfigSequelizeModelInjectionToken);
        await repository.create({ key: "MY_KEY", value: "my_value" });

        await expect(sequelizeConfigProvider.getValue("MY_KEY")).resolves.toBe("my_value");
        await expect(sequelizeConfigProvider.getValue("missing_key")).resolves.toBeNull();
    });

    it("transforms config values from sequelize when the provider is sequelize", async () => {
        expect.assertions(3);

        const repository = moduleRef.get<typeof ConfigSequelizeModel>(ConfigSequelizeModelInjectionToken);
        await repository.bulkCreate([
            { key: "SEQUELIZE_FIRST_VAR", value: "sequelize_first_value" },
            { key: "SEQUELIZE_SECOND_VAR", value: "sequelize_second_value" },
            { key: "sequelizeThirdVar", value: "sequelize_third_value" }
        ]);

        const config = await configService.transform(PersistedVariablesSequelizeConfig);

        expect(config).toBeDefined();
        expect(config).toBeInstanceOf(PersistedVariablesSequelizeConfig);
        expect(config).toMatchObject({
            firstVar: "sequelize_first_value",
            SEQUELIZE_SECOND_VAR: "sequelize_second_value",
            sequelizeThirdVar: "sequelize_third_value"
        });
    });

    it("reloads manageable config values from sequelize", async () => {
        expect.assertions(5);

        const repository = moduleRef.get<typeof ConfigSequelizeModel>(ConfigSequelizeModelInjectionToken);
        await repository.bulkCreate([
            { key: "first", value: "first_value" },
            { key: "second", value: "42" },
            { key: "not_three", value: "3" }
        ]);

        const config = await configService.transform(EditableSequelizeConfig);
        assert(config);

        expect(config).toBeDefined();
        expect(config).toBeInstanceOf(EditableSequelizeConfig);
        expect(config).toMatchObject({
            first: "first_value",
            second: "42",
            three: "3"
        });

        await repository.update({ value: "updated_first_value" }, { where: { key: "first" } });

        await config.reload();

        expect(config).toMatchObject({
            first: "updated_first_value",
            second: "42",
            three: "3"
        });

        await repository.update({ value: "re_updated_first_value" }, { where: { key: "first" } });
        await repository.update({ value: 1024 }, { where: { key: "second" } });
        await repository.update({ value: "42" }, { where: { key: "not_three" } });

        await config.reload();

        expect(config).toMatchObject({
            first: "re_updated_first_value",
            second: "1024",
            three: "42"
        });
    });

    describe("update", () => {
        let repository: typeof ConfigSequelizeModel;
        let config: EditableSequelizeConfig;

        beforeEach(async () => {
            repository = moduleRef.get<typeof ConfigSequelizeModel>(ConfigSequelizeModelInjectionToken);
            await repository.bulkCreate([
                { key: "first", value: "first_value" },
                { key: "second", value: "42" },
                { key: "not_three", value: "4" }
            ]);

            const loaded = await configService.transform(EditableSequelizeConfig);
            if (loaded === null) {
                throw new Error("Expected manageable config to be loaded");
            }
            config = loaded;
        });

        it("persists a single field update in sequelize and in memory", async () => {
            expect.assertions(4);

            await config.update({
                first: "updated_first_value"
            });

            expect(config).toMatchObject({
                first: "updated_first_value",
                second: "42",
                three: "4"
            });

            const [first, second, three] = await Promise.all([
                repository.findOne({ where: { key: "first" } }),
                repository.findOne({ where: { key: "second" } }),
                repository.findOne({ where: { key: "not_three" } })
            ]);

            expect(first?.getDataValue("value")).toBe("updated_first_value");
            expect(second?.getDataValue("value")).toBe("42");
            expect(three?.getDataValue("value")).toBe("4");
        });

        it("persists multiple field updates in sequelize and in memory", async () => {
            expect.assertions(4);

            await config.update({
                first: "re_updated_first_value",
                second: 2048
            });

            expect(config).toMatchObject({
                first: "re_updated_first_value",
                second: 2048,
                three: "4"
            });

            const [first, second, three] = await Promise.all([
                repository.findOne({ where: { key: "first" } }),
                repository.findOne({ where: { key: "second" } }),
                repository.findOne({ where: { key: "not_three" } })
            ]);

            expect(first?.getDataValue("value")).toBe("re_updated_first_value");
            expect(second?.getDataValue("value")).toBe("2048");
            expect(three?.getDataValue("value")).toBe("4");
        });

        it("persists all fields including aliased variable names", async () => {
            expect.assertions(4);

            await config.update({
                first: "re_updated_first_value",
                second: 2048,
                three: "42"
            });

            expect(config).toMatchObject({
                first: "re_updated_first_value",
                second: 2048,
                three: "42"
            });

            const [first, second, three] = await Promise.all([
                repository.findOne({ where: { key: "first" } }),
                repository.findOne({ where: { key: "second" } }),
                repository.findOne({ where: { key: "not_three" } })
            ]);

            expect(first?.getDataValue("value")).toBe("re_updated_first_value");
            expect(second?.getDataValue("value")).toBe("2048");
            expect(three?.getDataValue("value")).toBe("42");
        });
    });
});
