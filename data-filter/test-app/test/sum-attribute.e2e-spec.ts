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
     * MySQL returns SUM as a DECIMAL, which the driver hands back as a string.
     */
    it("sums the targeted path through findAll", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-SUM" });
        await using _l1 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "S1", quantity: 3 });
        await using _l2 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "S2", quantity: 9 });

        // Dynamic import keeps @Sum @Data out of AppModule / validateData workers.
        const { WarehousesSumData } = await import("../src/warehouses/filters/warehouses-sum.data");
        const repo = harness.app.get(DataFilterService).for(WarehousesSumData);
        const rows = (await repo.findAll({ where: { id: alpha.id } })) as unknown as {
            id: number;
            totalQuantity?: string;
            lines?: unknown;
        }[];

        expect(rows).toHaveLength(1);
        expect(rows[0].totalQuantity).toBe("12");
        expect(rows[0].lines).toBeUndefined();
    });

    /**
     * A @Sum declared on an included property is scoped to that include's path
     * and lifted onto the parent row, since the GROUP BY collapses the children.
     */
    it("lifts a @Sum declared on an included property onto the parent row", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-INCLUDED-SUM" });
        await using _l1 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "IS1", quantity: 6 });
        await using _l2 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "IS2", quantity: 8 });

        const { WarehousesIncludedSumData } = await import("../src/warehouses/filters/warehouses-included-sum.data");
        const repo = harness.app.get(DataFilterService).for(WarehousesIncludedSumData);

        const options = repo.generateFindOptions({ where: { id: alpha.id } });
        expect(options.group).toEqual(["id"]);

        const rows = (await repo.findAll({ where: { id: alpha.id } })) as unknown as {
            id: number;
            code?: string;
            totalQuantity?: string;
        }[];

        expect(rows).toHaveLength(1);
        expect(rows[0].totalQuantity).toBe("14");
        expect(rows[0].code).toBe("WH-INCLUDED-SUM");
    });
});
