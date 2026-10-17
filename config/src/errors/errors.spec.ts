import { Injectable } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { Variable } from "../decorators/variable.decorator";
import { ConfigModelNotFoundError } from "./config-model-not-found.error";
import { ConfigProviderNotFoundInModuleError } from "./config-provider-not-found-in-module.error";
import { ConfigProviderNotRegisteredError } from "./config-provider-not-registered.error";
import { ConfigVariablesNotDefinedError } from "./config-variables-not-defined.error";

class ExampleConfig {
    @Variable(false)
    public FIELD?: string;
}

@Injectable()
class ExampleProvider {}

describe("config errors", () => {
    it("configVariablesNotDefinedError formats variable names and config name", () => {
        expect.assertions(1);

        const error = new ConfigVariablesNotDefinedError(ExampleConfig, ["FOO", "BAR"]);

        expect(error.message).toBe(`Variables '["FOO","BAR"]' must be defined for config 'ExampleConfig'`);
    });

    it("configModelNotFoundError references the config type name", () => {
        expect.assertions(1);

        const error = new ConfigModelNotFoundError(ExampleConfig);

        expect(error.message).toContain("ExampleConfig");
    });

    it("configProviderNotRegisteredError references the provider type", () => {
        expect.assertions(1);

        const error = new ConfigProviderNotRegisteredError("custom");

        expect(error.message).toContain("'custom'");
    });

    it("configProviderNotFoundInModuleError references the provider class name", () => {
        expect.assertions(1);

        const error = new ConfigProviderNotFoundInModuleError(ExampleProvider);

        expect(error.message).toBe("Config provider 'ExampleProvider' not found in module.");
    });
});
