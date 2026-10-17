import { describe, expect, it } from "vitest";

import { ConfigUtils } from "./config.utils";
import { Variable } from "./decorators/variable.decorator";

class SampleConfig {
    @Variable(false)
    public PLACEHOLDER?: string;
}

describe("configUtils", () => {
    describe("getProviderToken", () => {
        it("returns the class name suffixed with Service", () => {
            expect.assertions(1);

            expect(ConfigUtils.getProviderToken(SampleConfig)).toBe("SampleConfigService");
        });
    });
});
