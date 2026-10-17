import { describe, expect, it } from "vitest";

import { ConfigProvider } from "../decorators/config-provider.decorator";
import type { IConfigProvider } from "../providers/config.provider";
import { EnvironmentConfigProvider } from "../providers/environment.config-provider";
import { ConfigProviderHandler } from "./config-provider.handler";

@ConfigProvider("handler-spec-provider")
class HandlerSpecProvider implements IConfigProvider {
    public async getValue(): Promise<string | undefined> {
        return Promise.resolve(undefined);
    }
}

describe("configProviderHandler", () => {
    it("registers providers via setType and retrieves them by type", () => {
        expect.assertions(2);

        expect(ConfigProviderHandler.getConfigProvider("handler-spec-provider")).toBe(HandlerSpecProvider);
        expect(ConfigProviderHandler.getConfig(HandlerSpecProvider).type).toBe("handler-spec-provider");
    });

    it("resolves the built-in environment provider", () => {
        expect.assertions(1);

        expect(ConfigProviderHandler.getConfigProvider(EnvironmentConfigProvider.type)).toBe(EnvironmentConfigProvider);
    });

    it("updateConfig merges metadata through the callback", () => {
        expect.assertions(2);

        ConfigProviderHandler.updateConfig(HandlerSpecProvider, (config) => ({
            ...config,
            type: "handler-spec-provider-updated"
        }));

        expect(ConfigProviderHandler.getConfig(HandlerSpecProvider).type).toBe("handler-spec-provider-updated");

        ConfigProviderHandler.saveConfig(HandlerSpecProvider, { type: "handler-spec-provider" });

        expect(ConfigProviderHandler.getConfigProvider("handler-spec-provider")).toBe(HandlerSpecProvider);
    });
});
