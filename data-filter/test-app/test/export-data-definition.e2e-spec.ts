import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededCargoBill } from "./seeds/create-seeded-cargo-bill";

describe("exportDataDefinition", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("lists confidential notes on filter but export repository omits them from downloaded fields", async () => {
        await using bill = await createSeededCargoBill({
            bill_code: "CB-100",
            shipper: "Northwind",
            confidential_note: "SECRET-ROUTE"
        });

        const list = await harness.postFilter("cargo-bills", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(list.status).toBe(200);
        const row = TestHarness.parseFilterBody<{
            id: number;
            bill_code?: string;
            confidential_note?: string;
        }>(list).values.find((value) => value.id === bill.id);
        expect(row?.confidential_note).toBe("SECRET-ROUTE");

        const download = await harness.postDownload("cargo-bills", "csv", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(download.status).toBe(200);
        const csv = TestHarness.parseCsv(download.text);
        expect(csv[0]).toEqual(["exports.bill_code", "exports.shipper", "exports.confidential_note"]);
        expect(
            csv.some((line) => line[0] === "CB-100" && line[1] === "Northwind" && line[2] === "MISSING")
        ).toBe(true);
        expect(download.text).not.toContain("SECRET-ROUTE");
    });
});
