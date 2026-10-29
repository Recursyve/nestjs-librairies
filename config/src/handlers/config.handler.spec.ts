import { describe, expect, it } from "vitest";

import { EnvironmentConfig } from "../decorators/config.decorator";
import { Variable } from "../decorators/variable.decorator";
import { EnvironmentConfigProvider } from "../providers/environment.config-provider";
import { ConfigHandler } from "./config.handler";

@EnvironmentConfig()
class EnvironmentConfigModel {
    @Variable(false)
    public DB_HOST?: string;

    @Variable({
        variableName: "DB_NAME",
        required: false
    })
    public dbName?: string;

    @Variable
    public DB_PORT!: string;
}

describe("configHandler", () => {
    describe("environment config", () => {
        it("should return a config with the provider set as environment", () => {
            expect.assertions(1);

            const config = ConfigHandler.getConfig(EnvironmentConfigModel);

            expect(config).toStrictEqual({
                provider: EnvironmentConfigProvider.type,
                variables: [
                    {
                        propertyKey: "DB_HOST",
                        variableName: "DB_HOST",
                        required: false
                    },
                    {
                        propertyKey: "dbName",
                        variableName: "DB_NAME",
                        required: false
                    },
                    {
                        propertyKey: "DB_PORT",
                        variableName: "DB_PORT",
                        required: true
                    }
                ]
            });
        });
    });

    describe("saveVariable", () => {
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class HandlerSpecModel {}

        it("appends variable metadata for new properties", () => {
            expect.assertions(1);

            ConfigHandler.saveVariable(HandlerSpecModel, {
                propertyKey: "first",
                variableName: "FIRST",
                required: true
            });

            const variable = ConfigHandler.getVariable(HandlerSpecModel, "first");

            expect(variable).toStrictEqual({
                propertyKey: "first",
                variableName: "FIRST",
                required: true
            });
        });

        it("replaces variable metadata when the property already exists", () => {
            expect.assertions(1);

            ConfigHandler.saveVariable(HandlerSpecModel, {
                propertyKey: "first",
                variableName: "FIRST_RENAMED",
                required: false
            });

            const variable = ConfigHandler.getVariable(HandlerSpecModel, "first");

            expect(variable).toStrictEqual({
                propertyKey: "first",
                variableName: "FIRST_RENAMED",
                required: false
            });
        });

        it("returns a copy of variables from getConfig without mutating stored metadata", () => {
            expect.assertions(2);

            const before = ConfigHandler.getConfig(HandlerSpecModel);
            before.variables.push({
                propertyKey: "injected",
                variableName: "INJECTED",
                required: true
            });

            const after = ConfigHandler.getConfig(HandlerSpecModel);

            const variable = ConfigHandler.getVariable(HandlerSpecModel, "injected");

            expect(variable).toBeNull();
            expect(after.variables).not.toBe(before.variables);
        });
    });
});
