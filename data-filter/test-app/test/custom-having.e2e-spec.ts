import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededContract } from "./seeds/create-seeded-contract";
import { createSeededContractSystem } from "./seeds/create-seeded-contract-system";
import { createSeededCoords } from "./seeds/create-seeded-coords";
import { createSeededInvoice } from "./seeds/create-seeded-invoice";
import { createSeededLocation } from "./seeds/create-seeded-location";
import { createSeededMaintenanceVisit } from "./seeds/create-seeded-maintenance-visit";
import { createSeededOwner } from "./seeds/create-seeded-owner";
import { createSeededPerson } from "./seeds/create-seeded-person";
import { createSeededPlace } from "./seeds/create-seeded-place";
import { createSeededPlaceOwner } from "./seeds/create-seeded-place-owner";
import { createSeededSystem } from "./seeds/create-seeded-system";
import { createSeededVisit } from "./seeds/create-seeded-visit";

/**
 * @p0 suspected-defect
 * Observed: custom HAVING operators trigger only_full_group_by errors on MySQL (HTTP 500).
 * Intended: grouped counts should be queryable without SQL errors.
 */
describe("custom HAVING operators on MySQL", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("currently responds with 500 for custom none operator on owner email", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL-N" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 1,
            address: "1 Test",
            postal_code: "H1A1A1"
        });
        await using place = await createSeededPlace({ billing_coord_id: coord.id, geo_coord_id: coord.id });
        await using person = await createSeededPerson({
            email: "owner@example.com",
            first_name: "Owner",
            last_name: "Name"
        });
        await using owner = await createSeededOwner({ person_id: person.id });
        await using _placeOwner = await createSeededPlaceOwner({ place_id: place.id, owner_id: owner.id });
        await using system = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-N",
            latitude: 45.5,
            longitude: -73.5
        });
        await using invoice = await createSeededInvoice({
            invoice_number: "INV-N",
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
        await using _cs = await createSeededContractSystem({
            contract_id: contract.id,
            system_id: system.id,
            active: true,
            activated_date: "2024-02-01"
        });

        const control = await harness.postFilter("contract-systems", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(control.status).toBe(200);

        const response = await harness.postFilter("contract-systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "ownerEmail", operation: "none", value: null }]
            }
        });

        TestHarness.expectInternalServerErrorFilterResponse(response);
    });

    it("currently responds with 500 for visit count having greater_or_equal", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL-V" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 1,
            address: "1 Test",
            postal_code: "H1A1A1"
        });
        await using place = await createSeededPlace({ billing_coord_id: coord.id, geo_coord_id: coord.id });
        await using system = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-V",
            latitude: 45.5,
            longitude: -73.5
        });
        await using invoice = await createSeededInvoice({
            invoice_number: "INV-V",
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
        await using v1 = await createSeededVisit({
            type: "inspection",
            visit_date: "2024-04-01",
            visit_time: "09:00:00"
        });
        await using v2 = await createSeededVisit({
            type: "repair",
            visit_date: "2024-05-01",
            visit_time: "14:30:00"
        });
        await using _mv1 = await createSeededMaintenanceVisit({ visit_id: v1.id, contract_system_id: cs.id });
        await using _mv2 = await createSeededMaintenanceVisit({ visit_id: v2.id, contract_system_id: cs.id });

        const control = await harness.postFilter("contract-systems", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(control.status).toBe(200);

        const response = await harness.postFilter("contract-systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "visitCount", operation: FilterOperatorTypes.GreaterOrEqual, value: 2 }]
            }
        });

        TestHarness.expectInternalServerErrorFilterResponse(response);
    });
});

describe("custom operators and grouped filters", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("filters contract-systems with owner first name and implicit last-name condition", async () => {
        await using locationA = await createSeededLocation({ value: "Montreal", unique_code: "MTL-A" });
        await using coordA = await createSeededCoords({
            location_id: locationA.id,
            street_number: 1,
            address: "1 A",
            postal_code: "H1A1A1"
        });
        await using placeA = await createSeededPlace({ billing_coord_id: coordA.id, geo_coord_id: coordA.id });
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });
        await using ownerA = await createSeededOwner({ person_id: alice.id });
        await using _poA = await createSeededPlaceOwner({ place_id: placeA.id, owner_id: ownerA.id });
        await using systemA = await createSeededSystem({
            place_id: placeA.id,
            file_number: "SYS-A",
            latitude: 45.5,
            longitude: -73.5
        });
        await using invoiceA = await createSeededInvoice({
            invoice_number: "INV-A",
            paid: true,
            subtotal: 1,
            total_cost: 1
        });
        await using contractA = await createSeededContract({
            invoice_id: invoiceA.id,
            start_date: "2024-01-01",
            end_date: "2025-12-31",
            payable_by: "2024-06-01",
            total_cost: 1000
        });
        await using csAlice = await createSeededContractSystem({
            contract_id: contractA.id,
            system_id: systemA.id,
            active: true,
            activated_date: "2024-02-01"
        });

        await using locationB = await createSeededLocation({ value: "Quebec", unique_code: "QC-B" });
        await using coordB = await createSeededCoords({
            location_id: locationB.id,
            street_number: 2,
            address: "2 B",
            postal_code: "G1R1R1"
        });
        await using placeB = await createSeededPlace({ billing_coord_id: coordB.id, geo_coord_id: coordB.id });
        await using bob = await createSeededPerson({
            email: "bob@example.com",
            first_name: "Bob",
            last_name: "Beta"
        });
        await using ownerB = await createSeededOwner({ person_id: bob.id });
        await using _poB = await createSeededPlaceOwner({ place_id: placeB.id, owner_id: ownerB.id });
        await using systemB = await createSeededSystem({
            place_id: placeB.id,
            file_number: "SYS-B",
            latitude: 46.8,
            longitude: -71.2
        });
        await using invoiceB = await createSeededInvoice({
            invoice_number: "INV-B",
            paid: true,
            subtotal: 1,
            total_cost: 1
        });
        await using contractB = await createSeededContract({
            invoice_id: invoiceB.id,
            start_date: "2024-01-01",
            end_date: "2025-12-31",
            payable_by: "2024-06-01",
            total_cost: 1000
        });
        await using _csBob = await createSeededContractSystem({
            contract_id: contractB.id,
            system_id: systemB.id,
            active: true,
            activated_date: "2024-02-01"
        });

        await using locationC = await createSeededLocation({ value: "Toronto", unique_code: "TO-C" });
        await using coordC = await createSeededCoords({
            location_id: locationC.id,
            street_number: 3,
            address: "3 C",
            postal_code: "M5H1A1"
        });
        await using placeC = await createSeededPlace({ billing_coord_id: coordC.id, geo_coord_id: coordC.id });
        await using aliceBeta = await createSeededPerson({
            email: "alice.beta@example.com",
            first_name: "Alice",
            last_name: "Beta"
        });
        await using ownerC = await createSeededOwner({ person_id: aliceBeta.id });
        await using _poC = await createSeededPlaceOwner({ place_id: placeC.id, owner_id: ownerC.id });
        await using systemC = await createSeededSystem({
            place_id: placeC.id,
            file_number: "SYS-C",
            latitude: 43.65,
            longitude: -79.38
        });
        await using invoiceC = await createSeededInvoice({
            invoice_number: "INV-C",
            paid: true,
            subtotal: 1,
            total_cost: 1
        });
        await using contractC = await createSeededContract({
            invoice_id: invoiceC.id,
            start_date: "2024-01-01",
            end_date: "2025-12-31",
            payable_by: "2024-06-01",
            total_cost: 1000
        });
        await using csAliceBeta = await createSeededContractSystem({
            contract_id: contractC.id,
            system_id: systemC.id,
            active: true,
            activated_date: "2024-02-01"
        });

        const ids = await harness.filterIds("contract-systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "ownerFirstName", operation: FilterOperatorTypes.Equal, value: "Alice" }]
            }
        });

        expect(ids).toEqual([csAlice.id]);
        expect(ids).not.toContain(csAliceBeta.id);
    });

    it("filters contract-systems by visit type select filter", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL-R" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 1,
            address: "1 Test",
            postal_code: "H1A1A1"
        });
        await using place = await createSeededPlace({ billing_coord_id: coord.id, geo_coord_id: coord.id });
        await using system = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-R",
            latitude: 45.5,
            longitude: -73.5
        });
        await using invoice = await createSeededInvoice({
            invoice_number: "INV-R",
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
        await using repair = await createSeededVisit({
            type: "repair",
            visit_date: "2024-05-01",
            visit_time: "14:30:00"
        });
        await using _mv = await createSeededMaintenanceVisit({
            visit_id: repair.id,
            contract_system_id: cs.id
        });

        await using location2 = await createSeededLocation({ value: "Quebec", unique_code: "QC-I" });
        await using coord2 = await createSeededCoords({
            location_id: location2.id,
            street_number: 2,
            address: "2 Test",
            postal_code: "G1R1R1"
        });
        await using place2 = await createSeededPlace({ billing_coord_id: coord2.id, geo_coord_id: coord2.id });
        await using system2 = await createSeededSystem({
            place_id: place2.id,
            file_number: "SYS-I",
            latitude: 46.8,
            longitude: -71.2
        });
        await using invoice2 = await createSeededInvoice({
            invoice_number: "INV-I",
            paid: true,
            subtotal: 1,
            total_cost: 1
        });
        await using contract2 = await createSeededContract({
            invoice_id: invoice2.id,
            start_date: "2024-01-01",
            end_date: "2025-12-31",
            payable_by: "2024-06-01",
            total_cost: 1000
        });
        await using cs2 = await createSeededContractSystem({
            contract_id: contract2.id,
            system_id: system2.id,
            active: true,
            activated_date: "2024-02-01"
        });
        await using inspection = await createSeededVisit({
            type: "inspection",
            visit_date: "2024-04-01",
            visit_time: "09:00:00"
        });
        await using _mv2 = await createSeededMaintenanceVisit({
            visit_id: inspection.id,
            contract_system_id: cs2.id
        });

        const ids = await harness.filterIds("contract-systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "statusSelect", operation: FilterOperatorTypes.Equal, value: "repair" }]
            }
        });

        expect(ids).toEqual([cs.id]);
    });
});
