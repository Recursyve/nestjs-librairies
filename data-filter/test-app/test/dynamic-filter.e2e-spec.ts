import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { TestHarness } from "./harness/test-harness";
import { createSeededVoyageManifest } from "./seeds/create-seeded-voyage-manifest";

describe("DynamicFilterController.transformQuery", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("injects season equality from x-voyage-season and leaves other seasons as decoys", async () => {
        await using spring = await createSeededVoyageManifest({
            vessel_name: "Aurora",
            season: "spring",
            cargo_code: "SP-1"
        });
        await using autumn = await createSeededVoyageManifest({
            vessel_name: "Borealis",
            season: "autumn",
            cargo_code: "AU-1"
        });

        const unscoped = await harness.filterIds("voyage-manifests", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(unscoped.sort()).toEqual([spring.id, autumn.id].sort());

        const scoped = await request(harness.app.getHttpServer())
            .post("/voyage-manifests/filter")
            .set("x-voyage-season", "spring")
            .send({
                page: TestHarness.defaultPage,
                query: { condition: "and", rules: [] }
            });

        expect(scoped.status).toBe(200);
        expect(TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(scoped))).toEqual([
            spring.id
        ]);

        const openApiScoped = await request(harness.app.getHttpServer())
            .post("/voyage-manifests-openapi/filter")
            .set("x-voyage-season", "autumn")
            .send({
                page: TestHarness.defaultPage,
                query: { condition: "and", rules: [] }
            });

        expect(openApiScoped.status).toBe(200);
        expect(TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(openApiScoped))).toEqual([
            autumn.id
        ]);
    });
});
