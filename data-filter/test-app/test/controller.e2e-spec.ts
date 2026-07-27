import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

    afterAll(async () => {
        await harness.close();
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
        const body = TestHarness.parseFilterBody<{ id: number; first_name: string }>(response);
        expect(body.total).toBe(1);
        expect(body.values[0].id).toBe(alice.id);
        expect(body.values[0].first_name).toBe("Alice");
        expect(body.page).toEqual(TestHarness.defaultPage);
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

    it("returns the same filtered count from filter-count as filter total", async () => {
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });
        await using bob = await createSeededPerson({
            email: "bob@example.com",
            first_name: "Bob",
            last_name: "Beta"
        });
        await using charlie = await createSeededPerson({
            email: "charlie@example.com",
            first_name: "Charlie",
            last_name: "Gamma"
        });
        await using outsider = await createSeededPerson({
            email: "outsider@otherdomain.com",
            first_name: "Outside",
            last_name: "World"
        });

        const query = {
            page: TestHarness.defaultPage,
            search: { value: "example" },
            query: {
                condition: "and" as const,
                rules: [{ id: "firstName", operation: FilterOperatorTypes.NotEqual, value: "Charlie" }]
            }
        };

        const filterResponse = await harness.postFilter("persons", query);
        const countResponse = await harness.postFilterCount("persons", query);

        expect(filterResponse.status).toBe(200);
        expect(countResponse.status).toBe(200);
        const filterBody = TestHarness.parseFilterBody<{ id: number }>(filterResponse);
        expect(harness.parseCountBody(countResponse)).toBe(filterBody.total);
        expect(TestHarness.mapFilterRowIds(filterBody).sort()).toEqual([alice.id, bob.id].sort());
        expect(TestHarness.mapFilterRowIds(filterBody)).not.toContain(charlie.id);
        expect(TestHarness.mapFilterRowIds(filterBody)).not.toContain(outsider.id);
    });

    it("exports filtered persons to CSV with expected headers and rows", async () => {
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

        const response = await harness.postDownload("persons", "csv", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.Equal, value: "Alice" }]
            }
        });

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/csv");

        const rows = TestHarness.parseCsv(response.text);
        expect(rows).toEqual([
            ["exports.email", "exports.first_name", "exports.last_name"],
            ["alice@example.com", "Alice", "Alpha"]
        ]);
        expect(rows).toHaveLength(2);
    });

    it("exports filtered persons to XLSX with expected content type", async () => {
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

        const response = await harness.postDownloadBinary("persons", "xlsx", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.Equal, value: "Alice" }]
            }
        });

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        expect(Number(response.headers["content-length"])).toBeGreaterThan(0);

        const rows = TestHarness.parseXlsx(response.body as Buffer);
        expect(rows[0]).toEqual(["exports.email", "exports.first_name", "exports.last_name"]);
        expect(rows[1]).toEqual(["alice@example.com", "Alice", "Alpha"]);
        expect(rows).toHaveLength(2);
    });

    it("exposes GET /persons/filter/config", async () => {
        const response = await harness.getFilterConfig("persons");

        expect(response.status).toBe(200);
        const ids = TestHarness.parseFilterConfig(response).map((item) => item.id);
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

        await using inactiveSystem = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-002",
            latitude: 45.5018,
            longitude: -73.5674
        });
        await using inactiveInvoice = await createSeededInvoice({
            invoice_number: "INV-002",
            paid: true,
            subtotal: 100,
            total_cost: 115
        });
        await using inactiveContract = await createSeededContract({
            start_date: "2024-01-01",
            end_date: "2025-12-31",
            invoice_id: inactiveInvoice.id,
            payable_by: "2024-06-01",
            total_cost: 1000
        });
        await using inactiveCs = await createSeededContractSystem({
            contract_id: inactiveContract.id,
            system_id: inactiveSystem.id,
            active: false,
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
        const body = TestHarness.parseFilterBody<{ id: number }>(response);
        expect(TestHarness.mapFilterRowIds(body)).toEqual([cs.id]);
        expect(TestHarness.mapFilterRowIds(body)).not.toContain(inactiveCs.id);
    });
});
