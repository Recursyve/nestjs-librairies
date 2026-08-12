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

    /**
     * FilterService adds the GROUP BY required by @Count (getCustomAttributeGroupBy).
     * Without a path, nothing else is joined, so the aggregate is projected.
     */
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

    /**
     * @p0 suspected-defect
     * The @Count path include projects the child columns next to GROUP BY `id`,
     * which MySQL only_full_group_by rejects — even on the filter route.
     */
    it("rejects the filter route when @Count targets a path", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-COUNT-OK" });
        await using _line = await createSeededStockLine({ warehouse_id: alpha.id, sku: "OK1", quantity: 3 });

        const response = await harness.postFilter("warehouses-count", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(500);
    });

    /**
     * @p0 suspected-defect
     * The repository API does not add the GROUP BY that @Count requires, so a
     * direct findAll hits MySQL only_full_group_by.
     */
    it("rejects findAll on WarehousesCountData under only_full_group_by", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-COUNT" });
        await using _line = await createSeededStockLine({ warehouse_id: alpha.id, sku: "C1", quantity: 3 });

        const { WarehousesCountData } = await import("../src/warehouses/filters/warehouses-count.data");
        const repo = harness.app.get(DataFilterService).for(WarehousesCountData);
        await expect(repo.findAll({ where: { id: alpha.id } })).rejects.toThrow(
            /only_full_group_by|ER_WRONG_FIELD_WITH_GROUP|not in GROUP BY/i
        );
    });
});
