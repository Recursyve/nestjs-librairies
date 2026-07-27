import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededContract } from "./seeds/create-seeded-contract";
import { createSeededContractSystem } from "./seeds/create-seeded-contract-system";
import { createSeededCoords } from "./seeds/create-seeded-coords";
import { createSeededInvoice } from "./seeds/create-seeded-invoice";
import { createSeededLocation } from "./seeds/create-seeded-location";
import { createSeededPerson } from "./seeds/create-seeded-person";
import { createSeededPlace } from "./seeds/create-seeded-place";
import { createSeededSystem } from "./seeds/create-seeded-system";

describe("controller / decorator integration", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    it("exposes POST /persons/filter through FilterController", async () => {
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });
        await using _bob = await createSeededPerson({
            email: "bob@example.com",
            first_name: "Bob",
            last_name: "Beta"
        });

        const response = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.Equal, value: "Alice" }]
            }
        });

        expect(response.status).toBe(200);
        expect(response.body.total).toBe(1);
        expect(response.body.values[0].id).toBe(alice.id);
        expect(response.body.values[0].first_name).toBe("Alice");
        expect(response.body.page).toEqual(TestHarness.defaultPage);
    });

    it("exposes POST /persons/filter-count", async () => {
        await using _alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });
        await using _bob = await createSeededPerson({
            email: "bob@example.com",
            first_name: "Bob",
            last_name: "Beta"
        });

        const response = await harness.postFilterCount("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.Equal, value: "Bob" }]
            }
        });

        expect(response.status).toBe(200);
        expect(harness.parseCountBody(response)).toBe(1);
    });

    it("exposes GET /persons/filter/config", async () => {
        const response = await harness.getFilterConfig("persons");

        expect(response.status).toBe(200);
        const ids = response.body.map((item: { id: string }) => item.id);
        expect(ids).toEqual(expect.arrayContaining(["firstName", "lastName", "email", "postalCode", "city"]));
    });

    it("wires @InjectFilter for contract-systems controller", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 100,
            address: "100 Main Street",
            postal_code: "H1A1A1"
        });
        await using place = await createSeededPlace({
            billing_coord_id: coord.id,
            geo_coord_id: coord.id
        });
        await using system = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-001",
            latitude: 45.5017,
            longitude: -73.5673
        });
        await using invoice = await createSeededInvoice({
            invoice_number: "INV-001",
            paid: true,
            subtotal: 100,
            total_cost: 115
        });
        await using contract = await createSeededContract({
            start_date: "2024-01-01",
            end_date: "2025-12-31",
            invoice_id: invoice.id,
            payable_by: "2024-06-01",
            total_cost: 1000
        });
        await using cs = await createSeededContractSystem({
            contract_id: contract.id,
            system_id: system.id,
            active: true,
            activated_date: "2024-02-01"
        });

        const response = await harness.postFilter("contract-systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "active", operation: FilterOperatorTypes.Equal, value: "yes" }]
            }
        });

        expect(response.status).toBe(200);
        expect(response.body.total).toBeGreaterThan(0);
        expect(response.body.values.map((row: { id: number }) => row.id)).toContain(cs.id);
    });
});
