import { AccessRules } from "./access-rules.model";

describe("AccessRules", () => {
    it("fromPermissions should returns a valid AccessRules", () => {
        const test1 = AccessRules.fromPermissions(["read", "update", "delete"]);
        expect(test1).toEqual({
            r: true,
            u: true,
            d: true
        });

        const test2 = AccessRules.fromPermissions(["read-test", "update-test", "delete-test"], "test");
        expect(test2).toEqual({
            r: true,
            u: true,
            d: true
        });

        const test3 = AccessRules.fromPermissions(["r-test", "u-test", "d-test"], "test", { r: "r", u: "u", d: "d" });
        expect(test3).toEqual({
            r: true,
            u: true,
            d: true
        });

        const test4 = AccessRules.fromPermissions(["r", "u", "d"], { r: "r", u: "u", d: "d" });
        expect(test4).toEqual({
            r: true,
            u: true,
            d: true
        });

        const test5 = AccessRules.fromPermissions(["r", "u"], { r: "r", u: "u", d: "d" });
        expect(test5).toEqual({
            r: true,
            u: true,
            d: false
        });

        const test6 = AccessRules.fromPermissions(["read", "update"]);
        expect(test6).toEqual({
            r: true,
            u: true,
            d: false
        });

        const test7 = AccessRules.fromPermissions(["r-test", "u-test"], "test", { r: "r", u: "u", d: "d" });
        expect(test7).toEqual({
            r: true,
            u: true,
            d: false
        });

        const test8 = AccessRules.fromPermissions(["read-test", "update-test"], "test");
        expect(test8).toEqual({
            r: true,
            u: true,
            d: false
        });
    });
});
