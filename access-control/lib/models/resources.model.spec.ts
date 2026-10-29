import { describe, expect, it } from "vitest";

import { AccessRules } from "./access-rules.model";
import { PolicyResourceTypes, PolicyResources, Resources } from "./resources.model";

describe(PolicyResources, () => {
    describe("type", () => {
        it("returns Wildcard when wildcard rules are set", () => {
            expect.assertions(1);

            const policy = PolicyResources.wildcard(AccessRules.all());

            expect(policy.type).toBe(PolicyResourceTypes.Wildcard);
        });

        it("returns Condition when a condition is set", () => {
            expect.assertions(1);

            const policy = PolicyResources.condition({ status: "open" }, AccessRules.readOnly());

            expect(policy.type).toBe(PolicyResourceTypes.Condition);
        });

        it("returns Resources when only resource ids are set", () => {
            expect.assertions(1);

            const policy = PolicyResources.resources([{ resourceId: 1, rules: AccessRules.all() }]);

            expect(policy.type).toBe(PolicyResourceTypes.Resources);
        });
    });
});

describe(Resources, () => {
    it("all() marks access to every resource", () => {
        expect.assertions(1);

        expect(Resources.all().all).toBe(true);
    });

    it("fromIds() stores the given ids", () => {
        expect.assertions(1);

        expect(Resources.fromIds([1, "abc"]).ids).toStrictEqual([1, "abc"]);
    });

    it("fromCondition() stores the where clause", () => {
        expect.assertions(1);

        expect(Resources.fromCondition({ ownerId: 7 }).where).toStrictEqual({ ownerId: 7 });
    });
});
