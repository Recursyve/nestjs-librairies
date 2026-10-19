import { describe, expect, it } from "vitest";

import { AccessActionType, AccessRules } from "./access-rules.model";

describe(AccessRules, () => {
    describe("factories", () => {
        it("all() grants read, update, and delete", () => {
            expect.assertions(1);

            expect(AccessRules.all()).toMatchObject({ r: true, u: true, d: true });
        });

        it("readOnly() grants read only", () => {
            expect.assertions(1);

            expect(AccessRules.readOnly()).toMatchObject({ r: true, u: false, d: false });
        });

        it("none() denies every action", () => {
            expect.assertions(1);

            expect(AccessRules.none()).toMatchObject({ r: false, u: false, d: false });
        });

        it("rud() sets each flag explicitly", () => {
            expect.assertions(1);

            expect(AccessRules.rud(true, false, true)).toMatchObject({ r: true, u: false, d: true });
        });
    });

    describe("fromString", () => {
        it("parses a JSON rules payload", () => {
            expect.assertions(1);

            expect(AccessRules.fromString('{"r":true,"u":false,"d":true}')).toMatchObject({
                r: true,
                u: false,
                d: true
            });
        });
    });

    describe("has", () => {
        it("returns the flag for the requested action", () => {
            expect.assertions(1);

            expect(AccessRules.readOnly().has(AccessActionType.Update)).toBe(false);
        });
    });

    describe("hasNoAccess", () => {
        it("is true when every action is denied", () => {
            expect.assertions(1);

            expect(AccessRules.none().hasNoAccess).toBe(true);
        });

        it("is false when any action is allowed", () => {
            expect.assertions(1);

            expect(AccessRules.readOnly().hasNoAccess).toBe(false);
        });
    });

    describe("fromPermissions", () => {
        it("maps default permission names", () => {
            expect.assertions(1);

            expect(AccessRules.fromPermissions(["read", "update", "delete"])).toMatchObject({
                r: true,
                u: true,
                d: true
            });
        });

        it("maps permission names with a suffix", () => {
            expect.assertions(1);

            expect(AccessRules.fromPermissions(["read-test", "update-test", "delete-test"], "test")).toMatchObject({
                r: true,
                u: true,
                d: true
            });
        });

        it("maps custom permission keys with a suffix", () => {
            expect.assertions(1);

            expect(
                AccessRules.fromPermissions(["r-test", "u-test", "d-test"], "test", { r: "r", u: "u", d: "d" })
            ).toMatchObject({ r: true, u: true, d: true });
        });

        it("maps custom permission keys without a suffix", () => {
            expect.assertions(1);

            expect(AccessRules.fromPermissions(["r", "u", "d"], { r: "r", u: "u", d: "d" })).toMatchObject({
                r: true,
                u: true,
                d: true
            });
        });

        it("leaves missing actions disabled", () => {
            expect.assertions(1);

            expect(AccessRules.fromPermissions(["read", "update"])).toMatchObject({ r: true, u: true, d: false });
        });
    });
});
