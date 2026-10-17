import { describe, expect, it } from "vitest";

import { ConfigHandler } from "../handlers/config.handler";
import { EnvironmentConfigProvider } from "../providers/environment.config-provider";
import { Config, EnvironmentConfig } from "./config.decorator";
import { Variable } from "./variable.decorator";

@EnvironmentConfig()
class EnvironmentAnnotatedModel {
    @Variable
    public HOST!: string;
}

@Config({ provider: "custom-provider" })
class CustomProviderModel {}

describe(EnvironmentConfig, () => {
    it("sets the environment provider on the config metadata", () => {
        expect.assertions(1);

        const config = ConfigHandler.getConfig(EnvironmentAnnotatedModel);

        expect(config.provider).toBe(EnvironmentConfigProvider.type);
    });
});

describe(Config, () => {
    it("merges custom config metadata", () => {
        expect.assertions(1);

        const config = ConfigHandler.getConfig(CustomProviderModel);

        expect(config.provider).toBe("custom-provider");
    });
});
