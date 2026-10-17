import { describe, expect, it } from "vitest";

import { createDateOnlyInstance } from "../../tests/date-only.fixture";
import { SequelizeUtils } from "./sequelize.utils";

describe("sequelizeUtils", () => {
    describe("formatInstanceDateOnly", () => {
        it("ignores null values", () => {
            expect.assertions(1);

            expect(() => {
                SequelizeUtils.formatInstanceDateOnly(null);
            }).not.toThrow();
        });

        it("ignores undefined values", () => {
            expect.assertions(1);

            expect(() => {
                SequelizeUtils.formatInstanceDateOnly(undefined);
            }).not.toThrow();
        });

        it("ignores non-object values", () => {
            expect.assertions(1);

            expect(() => {
                SequelizeUtils.formatInstanceDateOnly("not-an-object");
            }).not.toThrow();
        });

        it("converts DATEONLY strings to Date instances", () => {
            expect.assertions(1);

            const instance = createDateOnlyInstance("1990-05-15");

            SequelizeUtils.formatInstanceDateOnly(instance);

            expect(instance.dataValues["birthDate"]).toBeInstanceOf(Date);
        });

        it("preserves the calendar date when converting DATEONLY strings", () => {
            expect.assertions(1);

            const instance = createDateOnlyInstance("1990-05-15");

            SequelizeUtils.formatInstanceDateOnly(instance);

            expect((instance.dataValues["birthDate"] as Date).toISOString()).toBe("1990-05-15T00:00:00.000Z");
        });

        it("leaves non-DATEONLY attributes unchanged", () => {
            expect.assertions(1);

            const instance = {
                dataValues: { label: "1990-05-15" },
                rawAttributes: {
                    label: { type: { key: "STRING" } }
                }
            };
            Reflect.defineMetadata("design:type", Date, instance, "label");

            SequelizeUtils.formatInstanceDateOnly(instance);

            expect(instance.dataValues["label"]).toBe("1990-05-15");
        });

        it("formats nested object values", () => {
            expect.assertions(1);

            const nested = createDateOnlyInstance("2001-02-03");
            const parent = {
                dataValues: { nested },
                rawAttributes: {}
            };

            SequelizeUtils.formatInstanceDateOnly(parent);

            expect(nested.dataValues["birthDate"]).toBeInstanceOf(Date);
        });

        it("formats values inside nested arrays", () => {
            expect.assertions(1);

            const child = createDateOnlyInstance("2002-03-04");
            const parent = {
                dataValues: { nestedList: [child] },
                rawAttributes: {}
            };

            SequelizeUtils.formatInstanceDateOnly(parent);

            expect(child.dataValues["birthDate"]).toBeInstanceOf(Date);
        });
    });
});
