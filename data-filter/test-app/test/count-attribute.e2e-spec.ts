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

    /**
     * A @Count declared on an included property is scoped to that include's path
     * and lifted onto the parent row, since the GROUP BY collapses the children.
     */
    it("lifts a @Count declared on an included property onto the parent row", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-INCLUDED-COUNT" });
        await using _l1 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "I1", quantity: 3 });
        await using _l2 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "I2", quantity: 4 });

        const { WarehousesIncludedCountData } = await import(
            "../src/warehouses/filters/warehouses-included-count.data"
        );
        const repo = harness.app.get(DataFilterService).for(WarehousesIncludedCountData);

        const options = repo.generateFindOptions({ where: { id: alpha.id } });
        expect(options.group).toEqual(["id"]);

        const rows = (await repo.findAll({ where: { id: alpha.id } })) as unknown as {
            id: number;
            code?: string;
            lineCount?: number;
        }[];

        expect(rows).toHaveLength(1);
        expect(rows[0].lineCount).toBe(2);
        expect(rows[0].code).toBe("WH-INCLUDED-COUNT");
    });

    /**
     * The path is relative to the property, so it must be composed with it
     * rather than resolved from the root model.
     */
    it("resolves a path declared on an included property against the nested alias", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-NESTED-COUNT" });
        await using _l1 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "N1", quantity: 3 });
        await using _l2 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "N2", quantity: 4 });

        const { WarehousesNestedPathCountData } = await import(
            "../src/warehouses/filters/warehouses-included-count.data"
        );
        const repo = harness.app.get(DataFilterService).for(WarehousesNestedPathCountData);
        const rows = (await repo.findAll({ where: { id: alpha.id } })) as unknown as {
            id: number;
            ownerCount?: number;
        }[];

        expect(rows).toHaveLength(1);
        expect(rows[0].ownerCount).toBe(2);
    });

    it("counts distinct values of the targeted path", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-DISTINCT" });
        await using _l1 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "DUP", quantity: 1 });
        await using _l2 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "DUP", quantity: 2 });
        await using _l3 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "OTHER", quantity: 5 });

        const { WarehousesDistinctCountData } = await import("../src/warehouses/filters/warehouses-count.data");
        const repo = harness.app.get(DataFilterService).for(WarehousesDistinctCountData);
        const rows = (await repo.findAll({ where: { id: alpha.id } })) as unknown as {
            id: number;
            skuCount?: number;
        }[];

        expect(rows).toHaveLength(1);
        expect(rows[0].skuCount).toBe(2);
    });

    it("counts only the rows matching the custom attribute where", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-WHERE" });
        await using _l1 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "W1", quantity: 1 });
        await using _l2 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "W2", quantity: 6 });
        await using _l3 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "W3", quantity: 9 });

        const { WarehousesWhereCountData } = await import("../src/warehouses/filters/warehouses-count.data");
        const repo = harness.app.get(DataFilterService).for(WarehousesWhereCountData);
        const rows = (await repo.findAll({ where: { id: alpha.id } }, { minQuantity: 5 })) as unknown as {
            id: number;
            bigLineCount?: number;
        }[];

        expect(rows).toHaveLength(1);
        expect(rows[0].bigLineCount).toBe(2);
    });

    /**
     * Two @Count on the same association must keep independent predicates and
     * must not project the child id (MySQL only_full_group_by).
     */
    it("counts two filtered subsets of the same path as distinct aggregates", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-DUAL-COUNT" });
        await using _small = await createSeededStockLine({ warehouse_id: alpha.id, sku: "SMALL", quantity: 1 });
        await using _big1 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "BIG1", quantity: 6 });
        await using _big2 = await createSeededStockLine({ warehouse_id: alpha.id, sku: "BIG2", quantity: 9 });

        const { WarehousesDualWhereCountData } = await import("../src/warehouses/filters/warehouses-count.data");
        const repo = harness.app.get(DataFilterService).for(WarehousesDualWhereCountData);

        const options = repo.generateFindOptions({ where: { id: alpha.id } });
        expect(options.group).toEqual(["id"]);

        const projections = (options.attributes as unknown[]).filter(Array.isArray) as [ { val?: string }, string ][];
        expect(projections.map(([, alias]) => alias).sort()).toEqual(["bigLineCount", "smallLineCount"]);
        const sql = projections.map(([expression]) => expression.val ?? "").join(" ");
        expect(sql).toContain("COUNT(CASE WHEN");
        expect(sql).toContain("`lines`.`quantity` >= 5");
        expect(sql).toContain("`lines`.`quantity` < 5");

        const lines = (options.include as { as?: string; attributes?: unknown; where?: unknown }[])
            .find((include) => include.as === "lines");
        expect(lines?.attributes).toEqual([]);
        expect(lines?.where).toBeUndefined();

        const rows = (await repo.findAll({ where: { id: alpha.id } })) as unknown as {
            id: number;
            bigLineCount?: number;
            smallLineCount?: number;
        }[];

        expect(rows).toHaveLength(1);
        expect(rows[0].bigLineCount).toBe(2);
        expect(rows[0].smallLineCount).toBe(1);
        expect(rows[0].bigLineCount).not.toBe(rows[0].smallLineCount);
    });

    it("counts through the repository count helper", async () => {
        await using alpha = await createSeededWarehouse({ code: "WH-COUNT-HELPER" });
        await using _line = await createSeededStockLine({ warehouse_id: alpha.id, sku: "H1", quantity: 1 });

        const { WarehousesCountData } = await import("../src/warehouses/filters/warehouses-count.data");
        const repo = harness.app.get(DataFilterService).for(WarehousesCountData);
        await expect(repo.count({ id: alpha.id })).resolves.toBe(1);
    });
});
