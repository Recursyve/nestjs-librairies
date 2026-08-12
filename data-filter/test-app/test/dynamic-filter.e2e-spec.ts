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

    it("exposes filter-count, download, and config routes on Dynamic and OpenApiDynamic controllers", async () => {
        await using spring = await createSeededVoyageManifest({
            vessel_name: "Ceres",
            season: "spring",
            cargo_code: "SP-2"
        });

        for (const route of ["voyage-manifests", "voyage-manifests-openapi"] as const) {
            const count = await request(harness.app.getHttpServer())
                .post(`/${route}/filter-count`)
                .set("x-voyage-season", "spring")
                .send({
                    page: TestHarness.defaultPage,
                    query: { condition: "and", rules: [] }
                });
            expect(count.status).toBe(200);
            expect(Number(count.text)).toBe(1);

            const download = await request(harness.app.getHttpServer())
                .post(`/${route}/download/csv`)
                .set("x-voyage-season", "spring")
                .send({
                    page: TestHarness.defaultPage,
                    query: { condition: "and", rules: [] }
                });
            expect(download.status).toBe(200);
            expect(typeof download.text).toBe("string");

            const config = await request(harness.app.getHttpServer()).get(`/${route}/filter/config`);
            expect(config.status).toBe(200);
            expect(TestHarness.parseFilterConfig(config).some((entry) => entry.id === "season")).toBe(true);

            const configValue = await request(harness.app.getHttpServer())
                .get(`/${route}/filter/config/value`)
                .query({ id: "missingSelect", value: "x" });
            expect(configValue.status).toBe(200);
            expect(configValue.body).toEqual([]);

            const configId = await request(harness.app.getHttpServer())
                .get(`/${route}/filter/config/id`)
                .query({ id: "missingSelect", resourceId: "1" });
            expect(configId.status).toBe(200);
            expect(configId.body).toEqual({});
        }

        expect(spring.id).toBeGreaterThan(0);
    });
});
