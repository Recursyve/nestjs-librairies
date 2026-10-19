import { Injectable } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Transform } from "class-transformer";
import { assert, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ConfigModule } from "../config.module";
import { ConfigProvider } from "../decorators/config-provider.decorator";
import { Config, EnvironmentConfig } from "../decorators/config.decorator";
import { Variable } from "../decorators/variable.decorator";
import { ConfigProviderNotRegisteredError } from "../errors/config-provider-not-registered.error";
import { ConfigVariablesNotDefinedError } from "../errors/config-variables-not-defined.error";
import type { IConfigProvider } from "../providers/config.provider";
import { ConfigTransformerService } from "./config-transformer.service";

@EnvironmentConfig()
class EnvironmentConfigModel {
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

class DefaultConfigModel {
    @Variable("FIRST_VAR")
    public firstVar!: string;

    @Variable(true)
    public secondVar!: string;

    @Variable
    public THIRD_VAR!: string;
}

@Config({ provider: "unknown" })
class UnknownProviderConfigModel {
    @Variable("UNKNOWN_VAR")
    public var!: string;
}

class RequiredVariableEnvTest {
    @Variable(true)
    public firstVar!: string;

    @Variable
    public secondVar!: string;
}

class TransformedConfigModel {
    @Variable
    @Transform(({ value }) => +value)
    public myNumber!: number;
}

@EnvironmentConfig()
class ReloadableEnvironmentConfig {
    @Variable(false)
    public VALUE!: string;
}

class NoProviderMetadataConfig {
    @Variable(false)
    public VALUE!: string;
}

@Injectable()
@ConfigProvider("reload-spec-provider")
class ReloadSpecProvider implements IConfigProvider {
    public static type = "reload-spec-provider";

    public values: Record<string, string> = { RELOAD_KEY: "first" };

    public async getValue(key: string): Promise<string | undefined> {
        return Promise.resolve(this.values[key]);
    }

    public async hydrate(config: object): Promise<void> {
        await Promise.resolve();
        (config as unknown as ReloadableCustomConfig).hydrated = true;
    }
}

@Config({ provider: ReloadSpecProvider.type })
class ReloadableCustomConfig {
    @Variable("RELOAD_KEY")
    public value!: string;

    public hydrated?: boolean;
}

@EnvironmentConfig()
class EmptyStringRequiredConfig {
    @Variable(true)
    public REQUIRED_FIELD!: string;
}

describe(ConfigTransformerService, () => {
    describe("transform", () => {
        let moduleRef: TestingModule;
        let configService: ConfigTransformerService;

        const oldEnv = process.env;

        beforeAll(async () => {
            moduleRef = await Test.createTestingModule({
                imports: [ConfigModule.forRoot()]
            }).compile();
            await moduleRef.init();

            configService = moduleRef.get(ConfigTransformerService);
        });

        beforeEach(() => {
            process.env = { ...oldEnv };
        });

        it("transform should return the config from the environment for an environment config", async () => {
            expect.assertions(3);

            process.env["DB_HOST"] = "127.0.0.1";
            process.env["DB_NAME"] = "test";
            process.env["DB_PORT"] = "4200";

            const config = await configService.transform(EnvironmentConfigModel);

            expect(config).toBeDefined();
            expect(config).toBeInstanceOf(EnvironmentConfigModel);
            expect(config).toMatchObject({
                DB_HOST: "127.0.0.1",
                dbName: "test",
                DB_PORT: "4200"
            });
        });

        it("transform should return the config from the environment if no provider is specified", async () => {
            expect.assertions(3);

            process.env["FIRST_VAR"] = "a";
            process.env["secondVar"] = "b";
            process.env["THIRD_VAR"] = "c";

            const config = await configService.transform(DefaultConfigModel);

            expect(config).toBeDefined();
            expect(config).toBeInstanceOf(DefaultConfigModel);
            expect(config).toMatchObject({
                firstVar: "a",
                secondVar: "b",
                THIRD_VAR: "c"
            });
        });

        it("should throw an exception if the provider is not found", async () => {
            expect.assertions(1);

            await expect(configService.transform(UnknownProviderConfigModel)).rejects.toThrow(
                ConfigProviderNotRegisteredError
            );
        });

        it("should throw when required environment variables are missing", async () => {
            expect.assertions(1);

            await expect(configService.transform(EnvironmentConfigModel)).rejects.toThrow(
                ConfigVariablesNotDefinedError
            );
        });

        it("should throw when some required environment variables are still missing", async () => {
            expect.assertions(1);

            process.env["DB_HOST"] = "127.0.0.1";

            await expect(configService.transform(EnvironmentConfigModel)).rejects.toThrow(
                ConfigVariablesNotDefinedError
            );
        });

        it("should resolve when all required environment variables are set", async () => {
            expect.assertions(1);

            process.env["DB_HOST"] = "127.0.0.1";
            process.env["DB_PORT"] = "1234";

            await expect(configService.transform(EnvironmentConfigModel)).resolves.toMatchObject({
                DB_HOST: "127.0.0.1",
                DB_PORT: "1234"
            });
        });

        it("should pass the config to class-transformer", async () => {
            expect.assertions(3);

            process.env["myNumber"] = "42";
            const config = await configService.transform(TransformedConfigModel);
            assert(config);

            expect(config).toBeInstanceOf(TransformedConfigModel);
            expect(config.myNumber).toBeTypeOf("number");
            expect(config.myNumber).toBe(42);
        });

        it("should treat an empty string as missing for required variables", async () => {
            expect.assertions(1);

            process.env["REQUIRED_FIELD"] = "";

            await expect(configService.transform(EmptyStringRequiredConfig)).rejects.toThrow(
                ConfigVariablesNotDefinedError
            );
        });
    });

    describe("skip required validation", () => {
        it("should not throw if requirement validation is disabled", async () => {
            expect.assertions(3);

            const moduleWithoutValidation = await Test.createTestingModule({
                imports: [ConfigModule.forRoot({ skipRequiredFieldsCheck: true })]
            }).compile();
            await moduleWithoutValidation.init();

            const configService = moduleWithoutValidation.get(ConfigTransformerService);

            const config = await configService.transform(RequiredVariableEnvTest);
            assert(config);

            expect(config).toBeInstanceOf(RequiredVariableEnvTest);
            expect(config.firstVar).toBeUndefined();
            expect(config.secondVar).toBeUndefined();
        });
    });

    describe("reloadConfig", () => {
        let moduleRef: TestingModule;
        let configService: ConfigTransformerService;

        beforeAll(async () => {
            moduleRef = await Test.createTestingModule({
                imports: [ConfigModule.forRoot()],
                providers: [ReloadSpecProvider]
            }).compile();
            await moduleRef.init();

            configService = moduleRef.get(ConfigTransformerService);
        });

        it("reloads environment-backed config properties in place", async () => {
            expect.assertions(2);

            process.env["VALUE"] = "before";

            const config = await configService.transform(ReloadableEnvironmentConfig);
            assert(config);

            expect(config.VALUE).toBe("before");

            process.env["VALUE"] = "after";
            await configService.reloadConfig(config);

            expect(config.VALUE).toBe("after");
        });

        it("reloads custom provider values and runs hydrate on transform", async () => {
            expect.assertions(3);

            const provider = moduleRef.get(ReloadSpecProvider);
            const config = await configService.transform(ReloadableCustomConfig);
            assert(config);

            expect(config.value).toBe("first");
            expect(config.hydrated).toBe(true);

            provider.values["RELOAD_KEY"] = "second";
            await configService.reloadConfig(config);

            expect(config.value).toBe("second");
        });

        it("does not reload when config metadata has no provider", async () => {
            expect.assertions(2);

            process.env["VALUE"] = "initial";

            const config = await configService.transform(NoProviderMetadataConfig);
            assert(config);

            expect(config.VALUE).toBe("initial");

            process.env["VALUE"] = "changed";
            await configService.reloadConfig(config);

            expect(config.VALUE).toBe("initial");
        });
    });
});
