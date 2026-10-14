import { describe, expect, it } from "vitest";

import { DateUtils } from "./date";

describe("dateUtils", () => {
    describe("toDateOnly", () => {
        it("formats a UTC date as yyyy-mm-dd", () => {
            expect.assertions(1);

            const date = new Date(Date.UTC(2024, 0, 5, 15, 30));

            expect(DateUtils.toDateOnly(date)).toBe("2024-1-5");
        });
    });

    describe("toUtc", () => {
        it("returns UTC midnight timestamp for the date parts", () => {
            expect.assertions(1);

            const date = new Date(Date.UTC(2024, 5, 10, 12, 0));

            expect(DateUtils.toUtc(date)).toBe(Date.UTC(2024, 5, 10));
        });
    });

    describe("toUtcFromDateOnly", () => {
        it("parses an ISO date-only string to UTC midnight", () => {
            expect.assertions(1);

            expect(DateUtils.toUtcFromDateOnly("2024-03-15")).toBe(Date.UTC(2024, 2, 15));
        });
    });

    describe("toUtcFromString", () => {
        it("returns a Date when the string is considered valid", () => {
            expect.assertions(2);

            const result = DateUtils.toUtcFromString("2024-01-01T00:00:00.000Z");

            expect(result).toBeInstanceOf(Date);
            expect(result?.toISOString()).toBe("2024-01-01T00:00:00.000Z");
        });

        it("returns null when the string is invalid", () => {
            expect.assertions(1);

            expect(DateUtils.toUtcFromString("Invalid date")).toBeNull();
        });
    });

    describe("isValid", () => {
        it.each([
            [null, false],
            ["Invalid date", false],
            ["2024-01-01", true]
        ])("isValid(%j) is %j", (input, expected) => {
            expect.assertions(1);

            expect(DateUtils.isValid(input)).toBe(expected);
        });
    });

    describe("getIsoDateOnly", () => {
        it("returns the date portion of an ISO string", () => {
            expect.assertions(1);

            expect(DateUtils.getIsoDateOnly(new Date("2024-06-20T18:00:00.000Z"))).toBe("2024-06-20");
        });
    });

    describe("getUtcDateOnly", () => {
        it("normalizes a Date to UTC midnight", () => {
            expect.assertions(1);

            const result = DateUtils.getUtcDateOnly(new Date("2024-01-15T22:00:00.000Z"));

            expect(result.toISOString()).toBe("2024-01-15T00:00:00.000Z");
        });

        it("normalizes a date string to UTC midnight", () => {
            expect.assertions(1);

            const result = DateUtils.getUtcDateOnly("2024-01-15T22:00:00.000Z");

            expect(result.toISOString()).toBe("2024-01-15T00:00:00.000Z");
        });

        it("builds a UTC date from year, month index, and day", () => {
            expect.assertions(1);

            const result = DateUtils.getUtcDateOnly(2024, 0, 20);

            expect(result.toISOString()).toBe("2024-01-20T00:00:00.000Z");
        });
    });

    describe("getUtcTime", () => {
        it("returns hours and minutes in UTC", () => {
            expect.assertions(1);

            expect(DateUtils.getUtcTime(new Date("2024-01-01T14:05:00.000Z"))).toBe("14:5");
        });
    });

    describe("getDatesBetween", () => {
        it("returns only the start date when end is the same calendar day", () => {
            expect.assertions(1);

            const start = new Date("2024-01-01T00:00:00.000Z");
            const end = new Date("2024-01-01T12:00:00.000Z");

            expect(DateUtils.getDatesBetween(start, end, "days")).toStrictEqual([start]);
        });

        it("returns only the start date when end is the next day", () => {
            expect.assertions(1);

            const start = new Date("2024-01-01T00:00:00.000Z");
            const end = new Date("2024-01-02T00:00:00.000Z");

            expect(DateUtils.getDatesBetween(start, end, "days")).toStrictEqual([start]);
        });
    });

    describe("format", () => {
        it("formats a date using the English locale", () => {
            expect.assertions(1);

            expect(DateUtils.format("en", new Date("2024-01-15T00:00:00.000Z"))).toBe("01");
        });

        it("formats a date using the French locale", () => {
            expect.assertions(1);

            expect(DateUtils.format("fr", new Date("2024-01-15T00:00:00.000Z"))).toBe("01");
        });
    });
});
