import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededArtifact } from "./seeds/create-seeded-artifact";
import { createSeededMuseum } from "./seeds/create-seeded-museum";

type ArtifactRow = {
    title?: string;
    status?: string;
    display_rank?: number;
    museum?: { name?: string };
};

type MuseumRow = {
    id: number;
    name?: string;
    artifacts?: ArtifactRow[];
    archivedArtifacts?: ArtifactRow[];
};

describe("path attribute decorators (@Where @Required)", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("keeps only on_display artifacts and excludes museums without matches", async () => {
        await using louvre = await createSeededMuseum({ name: "Louvre" });
        await using emptyHall = await createSeededMuseum({ name: "Empty Hall" });
        await using archivedOnly = await createSeededMuseum({ name: "Archive Wing" });

        await using _a3 = await createSeededArtifact({
            museum_id: louvre.id,
            title: "Rank3",
            status: "on_display",
            display_rank: 3
        });
        await using _a1 = await createSeededArtifact({
            museum_id: louvre.id,
            title: "Rank1",
            status: "on_display",
            display_rank: 1
        });
        await using _archivedDecoy = await createSeededArtifact({
            museum_id: louvre.id,
            title: "VaultOnly",
            status: "archived",
            display_rank: 0
        });
        await using _archiveWing = await createSeededArtifact({
            museum_id: archivedOnly.id,
            title: "Hidden",
            status: "archived",
            display_rank: 1
        });

        const response = await harness.postFilter("museums", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const body = TestHarness.parseFilterBody<MuseumRow>(response);
        const ids = body.values.map((row) => row.id).sort();
        expect(ids).toEqual([louvre.id].sort());
        expect(ids).not.toContain(emptyHall.id);
        expect(ids).not.toContain(archivedOnly.id);

        const louvreRow = body.values.find((row) => row.id === louvre.id);
        const titles = (louvreRow?.artifacts ?? []).map((a) => a.title).sort();
        expect(titles).toEqual(["Rank1", "Rank3"].sort());
        expect(louvreRow?.artifacts?.some((a) => a.title === "VaultOnly")).toBe(false);
    });
});

describe("@Separate + @Order + @Limit", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("orders by display_rank and limits nested artifacts when separate is enabled", async () => {
        await using museum = await createSeededMuseum({ name: "Ordered Museum" });
        await using _a3 = await createSeededArtifact({
            museum_id: museum.id,
            title: "Rank3",
            status: "on_display",
            display_rank: 3
        });
        await using _a1 = await createSeededArtifact({
            museum_id: museum.id,
            title: "Rank1",
            status: "on_display",
            display_rank: 1
        });
        await using _a2 = await createSeededArtifact({
            museum_id: museum.id,
            title: "Rank2",
            status: "on_display",
            display_rank: 2
        });
        await using _archived = await createSeededArtifact({
            museum_id: museum.id,
            title: "Vault",
            status: "archived",
            display_rank: 0
        });

        const response = await harness.postFilter("museums-ordered-limited", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(response.status).toBe(200);
        const row = TestHarness.parseFilterBody<MuseumRow>(response).values.find((value) => value.id === museum.id);
        expect(row?.artifacts?.map((a) => a.title)).toEqual(["Rank1", "Rank2"]);
    });
});

describe("@Paranoid(false) nested artifacts", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("includes soft-deleted nested artifacts when @Paranoid(false) is set", async () => {
        await using museum = await createSeededMuseum({ name: "Paranoid Museum" });
        await using living = await createSeededArtifact({
            museum_id: museum.id,
            title: "Living",
            status: "on_display",
            display_rank: 1
        });
        await using ghost = await createSeededArtifact({
            museum_id: museum.id,
            title: "Ghost",
            status: "on_display",
            display_rank: 2
        });
        await ghost.softDelete();

        const defaultResponse = await harness.postFilter("museums", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(defaultResponse.status).toBe(200);
        const defaultRow = TestHarness.parseFilterBody<MuseumRow>(defaultResponse).values.find(
            (row) => row.id === museum.id
        );
        expect(defaultRow?.artifacts?.map((a) => a.title)).toEqual(["Living"]);

        const paranoidFalse = await harness.postFilter("museums-including-deleted", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(paranoidFalse.status).toBe(200);
        const includingDeleted = TestHarness.parseFilterBody<MuseumRow>(paranoidFalse).values.find(
            (row) => row.id === museum.id
        );
        const titles = (includingDeleted?.artifacts ?? []).map((a) => a.title).sort();
        expect(titles).toEqual(["Ghost", "Living"].sort());
        expect(living.id).toBeGreaterThan(0);
    });
});

describe("@Separate() with @IgnoreInSearch", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns nested artifacts and searches museum name without matching nested titles", async () => {
        await using museum = await createSeededMuseum({ name: "Separate Hall" });
        await using _artifact = await createSeededArtifact({
            museum_id: museum.id,
            title: "UniqueObsidianRelic",
            status: "on_display",
            display_rank: 1
        });

        const list = await harness.postFilter("museums-separate", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(list.status).toBe(200);
        const listed = TestHarness.parseFilterBody<MuseumRow>(list).values.find((row) => row.id === museum.id);
        expect(listed?.artifacts?.map((a) => a.title)).toEqual(["UniqueObsidianRelic"]);

        const byMuseumName = await harness.filterIds("museums-separate", {
            page: TestHarness.defaultPage,
            search: { value: "Separate Hall" },
            query: { condition: "and", rules: [] }
        });
        expect(byMuseumName).toEqual([museum.id]);

        const byArtifactTitle = await harness.filterIds("museums-separate", {
            page: TestHarness.defaultPage,
            search: { value: "UniqueObsidianRelic" },
            query: { condition: "and", rules: [] }
        });
        expect(byArtifactTitle).toEqual([]);
    });
});

/**
 * @p0 suspected-defect
 * Separate nested searchable attributes are still emitted in search WHERE clauses
 * without a matching include → MySQL unknown column / HTTP 500.
 */
describe("@Separate() searchable nested defect", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns HTTP 500 when searching a museum that registers separate nested searchable fields", async () => {
        await using museum = await createSeededMuseum({ name: "Broken Search Hall" });
        await using _artifact = await createSeededArtifact({
            museum_id: museum.id,
            title: "SearchableRelic",
            status: "on_display",
            display_rank: 1
        });

        const response = await harness.postFilter("museums-separate-searchable", {
            page: TestHarness.defaultPage,
            search: { value: "Broken" },
            query: { condition: "and", rules: [] }
        });
        TestHarness.expectInternalServerErrorFilterResponse(response);
        expect(museum.id).toBeGreaterThan(0);
    });
});

describe("@Path(path, where, required) overload", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("maps archived artifacts onto the renamed property and excludes display-only museums", async () => {
        await using withArchive = await createSeededMuseum({ name: "Has Archive" });
        await using displayOnly = await createSeededMuseum({ name: "Display Only" });

        await using _archived = await createSeededArtifact({
            museum_id: withArchive.id,
            title: "Stored",
            status: "archived",
            display_rank: 1
        });
        await using _displayDecoy = await createSeededArtifact({
            museum_id: withArchive.id,
            title: "Shown",
            status: "on_display",
            display_rank: 2
        });
        await using _displayOnly = await createSeededArtifact({
            museum_id: displayOnly.id,
            title: "ShownOnly",
            status: "on_display",
            display_rank: 1
        });

        const response = await harness.postFilter("museums-path-where", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(response.status).toBe(200);
        const body = TestHarness.parseFilterBody<MuseumRow>(response);
        expect(body.values.map((row) => row.id)).toEqual([withArchive.id]);
        expect(body.values[0]?.archivedArtifacts?.map((a) => a.title)).toEqual(["Stored"]);
        // Object.assign copies the raw Sequelize association key as well.
        expect(body.values[0]?.artifacts?.map((a) => a.title)).toEqual(["Stored"]);
    });
});

describe("@Required() without where", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("excludes museums that have zero artifacts", async () => {
        await using withArtifacts = await createSeededMuseum({ name: "Populated" });
        await using empty = await createSeededMuseum({ name: "Vacant" });
        await using _artifact = await createSeededArtifact({
            museum_id: withArtifacts.id,
            title: "OnlyPiece",
            status: "on_display",
            display_rank: 1
        });

        const ids = await harness.filterIds("museums-required", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(ids.sort()).toEqual([withArtifacts.id].sort());
        expect(ids).not.toContain(empty.id);
    });
});

describe("Include(path, separate: boolean) overload", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("loads nested museum under artifacts via Include(path, false)", async () => {
        await using museum = await createSeededMuseum({ name: "Include Nested Museum" });
        await using _artifact = await createSeededArtifact({
            museum_id: museum.id,
            title: "NestedMuseumProbe",
            status: "on_display",
            display_rank: 1
        });

        const response = await harness.postFilter("museums-include-nested", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(response.status).toBe(200);
        const row = TestHarness.parseFilterBody<MuseumRow>(response).values.find((value) => value.id === museum.id);
        expect(row?.artifacts?.[0]?.title).toBe("NestedMuseumProbe");
        expect(row?.artifacts?.[0]?.museum?.name).toBe("Include Nested Museum");
    });
});

/**
 * @p0 suspected-defect
 * Include(path, true) on BelongsTo throws at query time.
 * Module is loaded only here so AppModule validateData stays free of collateral errors.
 */
describe("Include(path, true) BelongsTo defect", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        const { MuseumsIncludeSeparateModule } = await import("../src/museums/museums-include-separate.module");
        harness = await TestHarness.create({ imports: [MuseumsIncludeSeparateModule] });
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns HTTP 500 for Include(path, true) on a BelongsTo association", async () => {
        await using museum = await createSeededMuseum({ name: "Include Separate Boom" });
        await using _artifact = await createSeededArtifact({
            museum_id: museum.id,
            title: "BoomRelic",
            status: "on_display",
            display_rank: 1
        });

        const response = await harness.postFilter("museums-include-separate", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        TestHarness.expectInternalServerErrorFilterResponse(response);
        expect(museum.id).toBeGreaterThan(0);
    });
});
