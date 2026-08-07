import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededContract } from "./seeds/create-seeded-contract";
import { createSeededContractSystem } from "./seeds/create-seeded-contract-system";
import { createSeededCoords } from "./seeds/create-seeded-coords";
import { createSeededInvoice } from "./seeds/create-seeded-invoice";
import { createSeededLocation } from "./seeds/create-seeded-location";
import { createSeededOwner } from "./seeds/create-seeded-owner";
import { createSeededPerson } from "./seeds/create-seeded-person";
import { createSeededPlace } from "./seeds/create-seeded-place";
import { createSeededPlaceOwner } from "./seeds/create-seeded-place-owner";
import { createSeededSystem } from "./seeds/create-seeded-system";

describe("nested includes / associations", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("filters persons on nested coord postal code", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 100,
            address: "100 Main Street",
            postal_code: "H1A1A1"
        });
        await using alice = await createSeededPerson({
            coord_id: coord.id,
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });
        await using otherLocation = await createSeededLocation({ value: "Quebec", unique_code: "QC" });
        await using otherCoord = await createSeededCoords({
            location_id: otherLocation.id,
            street_number: 200,
            address: "200 Rue Saint-Jean",
            postal_code: "G1R1R1"
        });
        await using _bob = await createSeededPerson({
            coord_id: otherCoord.id,
            email: "bob@example.com",
            first_name: "Bob",
            last_name: "Beta"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "postalCode", operation: FilterOperatorTypes.Equal, value: "H1A1A1" }]
            }
        });

        expect(ids).toEqual([alice.id]);
    });

    it("filters persons on deeply nested location value", async () => {
        await using montreal = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using montrealCoord = await createSeededCoords({
            location_id: montreal.id,
            street_number: 100,
            address: "100 Main Street",
            postal_code: "H1A1A1"
        });
        await using _alice = await createSeededPerson({
            coord_id: montrealCoord.id,
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });
        await using quebec = await createSeededLocation({ value: "Quebec", unique_code: "QC" });
        await using quebecCoord = await createSeededCoords({
            location_id: quebec.id,
            street_number: 200,
            address: "200 Rue Saint-Jean",
            postal_code: "G1R1R1"
        });
        await using bob = await createSeededPerson({
            coord_id: quebecCoord.id,
            email: "bob@example.com",
            first_name: "Bob",
            last_name: "Beta"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "city", operation: FilterOperatorTypes.Equal, value: "Quebec" }]
            }
        });

        expect(ids).toEqual([bob.id]);
    });

    it("filters contract-systems on nested invoice paid flag", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 100,
            address: "100 Main",
            postal_code: "H1A1A1"
        });
        await using place = await createSeededPlace({ billing_coord_id: coord.id, geo_coord_id: coord.id });
        await using systemA = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-A",
            latitude: 45.5,
            longitude: -73.5
        });
        await using systemB = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-B",
            latitude: 45.6,
            longitude: -73.6
        });
        await using paidInvoice = await createSeededInvoice({
            invoice_number: "INV-PAID",
            paid: true,
            subtotal: 100,
            total_cost: 115
        });
        await using unpaidInvoice = await createSeededInvoice({
            invoice_number: "INV-UNPAID",
            paid: false,
            subtotal: 200,
            total_cost: 230
        });
        await using paidContract = await createSeededContract({
            invoice_id: paidInvoice.id,
            start_date: "2024-01-01",
            end_date: "2025-12-31",
            payable_by: "2024-06-01",
            total_cost: 1000
        });
        await using unpaidContract = await createSeededContract({
            invoice_id: unpaidInvoice.id,
            start_date: "2020-01-01",
            end_date: "2021-12-31",
            payable_by: "2020-06-01",
            total_cost: 500
        });
        await using cs1 = await createSeededContractSystem({
            contract_id: paidContract.id,
            system_id: systemA.id,
            active: true,
            activated_date: "2024-02-01"
        });
        await using cs2 = await createSeededContractSystem({
            contract_id: paidContract.id,
            system_id: systemB.id,
            active: false,
            activated_date: "2024-03-01"
        });
        await using _cs3 = await createSeededContractSystem({
            contract_id: unpaidContract.id,
            system_id: systemA.id,
            active: true,
            activated_date: "2020-05-01"
        });

        const ids = await harness.filterIds("contract-systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "invoicePaid", operation: FilterOperatorTypes.Equal, value: "paid" }]
            }
        });

        expect(ids.sort()).toEqual([cs1.id, cs2.id].sort());
    });

    it("filters contract-systems on nested system file number", async () => {
        await using location = await createSeededLocation({ value: "Toronto", unique_code: "TO" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 300,
            address: "300 King",
            postal_code: "M5V1J2"
        });
        await using place = await createSeededPlace({ billing_coord_id: coord.id, geo_coord_id: coord.id });
        await using system = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-TO-003",
            latitude: 43.65,
            longitude: -79.38
        });
        await using invoice = await createSeededInvoice({
            invoice_number: "INV-1",
            paid: false,
            subtotal: 1,
            total_cost: 1
        });
        await using contract = await createSeededContract({
            invoice_id: invoice.id,
            start_date: "2020-01-01",
            end_date: "2021-12-31",
            payable_by: "2020-06-01",
            total_cost: 500
        });
        await using cs = await createSeededContractSystem({
            contract_id: contract.id,
            system_id: system.id,
            active: true,
            activated_date: "2020-05-01"
        });

        const ids = await harness.filterIds("contract-systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "systemFileNumber", operation: FilterOperatorTypes.Equal, value: "SYS-TO-003" }]
            }
        });

        expect(ids).toEqual([cs.id]);
    });

    it("returns nested owner person data in contract-system results", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 100,
            address: "100 Main",
            postal_code: "H1A1A1"
        });
        await using place = await createSeededPlace({ billing_coord_id: coord.id, geo_coord_id: coord.id });
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });
        await using owner = await createSeededOwner({ person_id: alice.id });
        await using _placeOwner = await createSeededPlaceOwner({ place_id: place.id, owner_id: owner.id });
        await using system = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-001",
            latitude: 45.5,
            longitude: -73.5
        });
        await using invoice = await createSeededInvoice({
            invoice_number: "INV-1",
            paid: true,
            subtotal: 1,
            total_cost: 1
        });
        await using contract = await createSeededContract({
            invoice_id: invoice.id,
            start_date: "2024-01-01",
            end_date: "2025-12-31",
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

        const body = TestHarness.parseFilterBody<{
            id: number;
            system: { place: { owners: Array<{ person: { email: string } }> } };
        }>(response);
        const row = body.values.find((r) => r.id === cs.id);
        expect(row?.system.place.owners[0].person.email).toBe("alice@example.com");
    });
});
