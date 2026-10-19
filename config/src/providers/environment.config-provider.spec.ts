import { describe, expect, it } from "vitest";

import { EnvironmentConfigProvider } from "./environment.config-provider";

describe(EnvironmentConfigProvider, () => {
    const provider = new EnvironmentConfigProvider();

    it("exposes the environment provider type", () => {
        expect.assertions(1);

        expect(EnvironmentConfigProvider.type).toBe("environment");
    });

    it("getValue resolves env entries", async () => {
        expect.assertions(2);

        process.env["CONFIG_TEST_KEY"] = "value";

        await expect(provider.getValue("CONFIG_TEST_KEY")).resolves.toBe("value");
        await expect(provider.getValue("CONFIG_TEST_MISSING")).resolves.toBeUndefined();
    });
});
