import { DataFilterService } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededStockLine } from "./seeds/create-seeded-stock-line";
import { createSeededWarehouse } from "./seeds/create-seeded-warehouse";

describe("@Count custom attribute", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        const { WarehousesCountModule } = await import("../src/warehouses/warehouses-count.module");
        harness = await TestHarness.create({ imports: [WarehousesCountModule] });
    });

    afterAll(async () => {
        await harness.close();
    });

    it("projects a path-less counted attribute through the filter route", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-ROOT-COUNT" });

        const response = await harness.postFilter("warehouses-root-count", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const rows = TestHarness.parseFilterBody<{ id: number; code?: string; selfCount?: number }>(response).values;
        expect(rows.find((row) => row.id === alpha.id)?.selfCount).toBe(1);
    });

    it("counts rows of the targeted path through the filter route", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-COUNT-OK" });
        await using _a1 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "OK1", quantity: 3 });
        await using _a2 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "OK2", quantity: 7 });
        await using empty = await createSeededWarehouse({ code: "WH-COUNT-EMPTY" });

        const response = await harness.postFilter("warehouses-count", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const rows = TestHarness.parseFilterBody<{ id: number; code?: string; lineCount?: number }>(response).values;
        expect(rows.find((row) => row.id === alpha.id)?.lineCount).toBe(2);
        expect(rows.find((row) => row.id === empty.id)?.lineCount).toBe(0);
    });

    /**
     * The repository adds the GROUP BY that @Count requires, and the counted path
     * is joined without projecting its columns.
     */
    it("counts rows of the targeted path through findAll", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-COUNT" });
        await using _l1 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "C1", quantity: 3 });
        await using _l2 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "C2", quantity: 4 });

        const { WarehousesCountData } = await import("../src/warehouses/filters/warehouses-count.data");
        const repo = harness.app.get(DataFilterService).for(WarehousesCountData);
        const rows = (await repo.findAll({ where: { id: alpha.id } })) as unknown as {
            id: number;
            code?: string;
            lineCount?: number;
            lines?: unknown;
        }[];

        expect(rows).toHaveLength(1);
        expect(rows[0].lineCount).toBe(2);
        expect(rows[0].code).toBe("WH-COUNT");
        expect(rows[0].lines).toBeUndefined();
    });

    it("counts through the repository count helper", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-COUNT-HELPER" });
        await using _line = await createSeededStockLine({ warehouse_id: alpha.id, sku: "H1", quantity: 1 });

        const { WarehousesCountData } = await import("../src/warehouses/filters/warehouses-count.data");
        const repo = harness.app.get(DataFilterService).for(WarehousesCountData);
        await expect(repo.count({ id: alpha.id })).resolves.toBe(1);
    });
});
