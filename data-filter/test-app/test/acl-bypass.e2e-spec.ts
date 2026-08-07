import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AclBypassHarness } from "./harness/acl-bypass-harness";
import { TestHarness } from "./harness/test-harness";
import { createSeededLocation } from "./seeds/create-seeded-location";

describe("global filter.disableAccessControl", () => {
    let harness: AclBypassHarness;

    beforeAll(async () => {
        harness = await AclBypassHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns all rows even when a user with restrictive ACL ids is present", async () => {
        await using montreal = await createSeededLocation({ value: "Montreal", unique_code: "ACL-BYPASS-1" });
        await using quebec = await createSeededLocation({ value: "Quebec", unique_code: "ACL-BYPASS-2" });

        const ids = await harness.filterIds(
            "locations",
            {
                page: TestHarness.defaultPage,
                query: { condition: "and", rules: [] }
            },
            { language: "fr", allowedPersonIds: [montreal.id] }
        );

        expect(ids.sort()).toEqual([montreal.id, quebec.id].sort());
    });
});
