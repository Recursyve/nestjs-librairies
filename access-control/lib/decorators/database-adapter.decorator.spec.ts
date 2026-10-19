import "reflect-metadata";

import { describe, expect, it } from "vitest";

import { DATABASE_ADAPTER_METADATA } from "./constant";
import { DatabaseAdapter } from "./database-adapter.decorator";

@DatabaseAdapter({ type: "main" })
class MainAdapter {}

describe(DatabaseAdapter, () => {
    it("stores adapter config on the decorated class", () => {
        expect.assertions(1);

        expect(Reflect.getMetadata(DATABASE_ADAPTER_METADATA, MainAdapter)).toStrictEqual({ type: "main" });
    });
});
