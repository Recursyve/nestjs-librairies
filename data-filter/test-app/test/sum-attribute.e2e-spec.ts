import { DataFilterService, FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededStockLine } from "./seeds/create-seeded-stock-line";
import { createSeededWarehouse } from "./seeds/create-seeded-warehouse";

describe("@Sum custom attribute", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("exposes the sum-backed having filter in getConfig", async () => {
        const config = await harness.getFilterConfig("warehouses");
        expect(config.status).toBe(200);
        expect(TestHarness.parseFilterConfig(config).some((entry) => entry.id === "minTotalQuantity")).toBe(true);
        expect(TestHarness.parseFilterConfig(config).some((entry) => entry.id === "code")).toBe(true);
    });

    it("lists warehouses without @Sum on the AppModule data definition", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-ALPHA" });
        await using beta = await createSeededWarehouse({ code: "WH-BETA" });
        await using _a1 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "A1", quantity: 10 });
        await using _a2 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "A2", quantity: 15 });
        await using _b1 = await createSeededStockLine({ warehouse_id: beta.id, sku: "B1", quantity: 4 });

        const response = await harness.postFilter("warehouses", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(response.status).toBe(200);
        expect(TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response)).sort()).toEqual(
            [alpha.id, beta.id].sort()
        );
    });

    /**
     * @p0 suspected-defect
     * HAVING sum(lines.quantity) without GROUP BY → only_full_group_by / HTTP 500.
     */
    it("returns HTTP 500 when filtering warehouses by minTotalQuantity having", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-HAVING-A" });
        await using _a1 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "HA1", quantity: 25 });

        const having = await harness.postFilter("warehouses", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [
                    {
                        id: "minTotalQuantity",
                        operation: FilterOperatorTypes.GreaterOrEqual,
                        value: 20
                    }
                ]
            }
        });
        TestHarness.expectInternalServerErrorFilterResponse(having);
        expect(alpha.id).toBeGreaterThan(0);
    });

    /**
     * @p0 suspected-defect
     * @Sum with a nested path triggers GROUP BY + joined child columns under MySQL
     * only_full_group_by. WarehousesSumData is imported only here (not AppModule).
     */
    it("rejects findAll on WarehousesSumData under only_full_group_by", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-SUM" });
        await using _line = await createSeededStockLine({ warehouse_id: alpha.id, sku: "S1", quantity: 3 });

        // Dynamic import keeps @Sum @Data out of AppModule / validateData workers.
        const { WarehousesSumData } = await import("../src/warehouses/filters/warehouses-sum.data");
        const repo = harness.app.get(DataFilterService).for(WarehousesSumData);
        await expect(repo.findAll({ where: { id: alpha.id } })).rejects.toThrow(
            /only_full_group_by|ER_WRONG_FIELD_WITH_GROUP|not in GROUP BY/i
        );
    });
});
