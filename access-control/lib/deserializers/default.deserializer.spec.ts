import { describe, expect, it } from "vitest";

import { DefaultDeserializer } from "./default.deserializer";

describe(DefaultDeserializer, () => {
    it("returns req.user from deserializeUser", async () => {
        expect.assertions(1);

        const deserializer = new DefaultDeserializer();
        const user = { id: "user-1", role: "admin" };

        await expect(deserializer.deserializeUser({ user })).resolves.toBe(user);
    });
});
