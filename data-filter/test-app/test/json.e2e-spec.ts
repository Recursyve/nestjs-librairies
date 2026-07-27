import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededProduct } from "./seeds/create-seeded-product";

describe("JSON filtering and search behavior", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    it("filters products by JSON object path category", async () => {
        await using widget = await createSeededProduct({
            metadata: { brand: "Acme", category: "electronics", rating: 5 },
            name: "Widget Pro",
            sku: "WDG-001",
            status: "active",
            stock: 10,
            tags: ["new", "featured"]
        });
        await using gadget = await createSeededProduct({
            metadata: { brand: "BetaCorp", category: "electronics" },
            name: "Gadget Basic",
            sku: "GDG-002",
            status: "pending",
            stock: 0,
            tags: ["sale"]
        });
        await using manual = await createSeededProduct({
            metadata: { category: "books", language: "en" },
            name: "Operator Manual",
            sku: "BK-003",
            status: "inactive",
            stock: 25,
            tags: ["used"]
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "category", operation: FilterOperatorTypes.Equal, value: "electronics" }]
            }
        });

        expect(ids.sort()).toEqual([widget.id, gadget.id].sort());
    });

    it("filters products by JSON object path brand", async () => {
        await using widget = await createSeededProduct({
            metadata: { brand: "Acme", category: "electronics", rating: 5 },
            name: "Widget Pro",
            sku: "WDG-001",
            status: "active",
            stock: 10,
            tags: ["new", "featured"]
        });
        await using gadget = await createSeededProduct({
            metadata: { brand: "BetaCorp", category: "electronics" },
            name: "Gadget Basic",
            sku: "GDG-002",
            status: "pending",
            stock: 0,
            tags: ["sale"]
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "brand", operation: FilterOperatorTypes.Equal, value: "Acme" }]
            }
        });

        expect(ids).toEqual([widget.id]);
    });

    it("filters products by JSON array tag equal", async () => {
        await using widget = await createSeededProduct({
            metadata: { brand: "Acme", category: "electronics", rating: 5 },
            name: "Widget Pro",
            sku: "WDG-001",
            status: "active",
            stock: 10,
            tags: ["new", "featured"]
        });
        await using gadget = await createSeededProduct({
            metadata: { brand: "BetaCorp", category: "electronics" },
            name: "Gadget Basic",
            sku: "GDG-002",
            status: "pending",
            stock: 0,
            tags: ["sale"]
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "tag", operation: FilterOperatorTypes.Equal, value: "featured" }]
            }
        });

        expect(ids).toEqual([widget.id]);
    });
});
