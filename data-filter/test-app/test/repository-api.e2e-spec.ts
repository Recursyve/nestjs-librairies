import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { TestHarness } from "./harness/test-harness";
import { createSeededArtifact } from "./seeds/create-seeded-artifact";
import { createSeededMuseum } from "./seeds/create-seeded-museum";

describe("DataFilterService.for / DataFilterRepository public API", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("finds, counts, searches, and downloads through the repository API", async () => {
        await using alpha = await createSeededMuseum({ name: "Repo Alpha" });
        await using beta = await createSeededMuseum({ name: "Repo Beta" });
        await using _artifact = await createSeededArtifact({
            museum_id: alpha.id,
            title: "RepoRelic",
            status: "on_display",
            display_rank: 1
        });

        const byPk = await request(harness.app.getHttpServer()).get(`/repository-probes/by-pk/${alpha.id}`);
        expect(byPk.status).toBe(200);
        expect(byPk.body).toMatchObject({
            found: true,
            id: alpha.id,
            name: "Repo Alpha",
            artifactTitles: ["RepoRelic"]
        });

        const missing = await request(harness.app.getHttpServer()).get("/repository-probes/by-pk/999999");
        expect(missing.status).toBe(200);
        expect(missing.body.found).toBe(false);

        const findOne = await request(harness.app.getHttpServer())
            .post("/repository-probes/find-one")
            .query({ name: "Repo Beta" });
        expect(findOne.status).toBe(200);
        expect(findOne.body).toEqual({ found: true, id: beta.id });

        const findAll = await request(harness.app.getHttpServer()).post("/repository-probes/find-all");
        expect(findAll.status).toBe(200);
        expect(findAll.body.ids.sort()).toEqual([alpha.id, beta.id].sort());
        expect(findAll.body.names.sort()).toEqual(["Repo Alpha", "Repo Beta"].sort());

        /**
         * @p0 suspected-defect
         * repository.count() with projected @Attributes selects non-aggregated
         * columns alongside count() under MySQL only_full_group_by.
         */
        const count = await request(harness.app.getHttpServer()).post("/repository-probes/count");
        expect(count.status).toBe(500);

        const search = await request(harness.app.getHttpServer())
            .post("/repository-probes/search")
            .query({ q: "Repo Alpha" });
        expect(search.status).toBe(200);
        expect(search.body.ids).toEqual([alpha.id]);
        expect(search.body.names).toEqual(["Repo Alpha"]);

        const decoySearch = await request(harness.app.getHttpServer())
            .post("/repository-probes/search")
            .query({ q: "NoSuchMuseumToken" });
        expect(decoySearch.status).toBe(200);
        expect(decoySearch.body.ids).toEqual([]);
        expect(decoySearch.body.names).toEqual([]);

        const attrs = await request(harness.app.getHttpServer()).get("/repository-probes/search-attributes");
        expect(attrs.status).toBe(200);
        expect(attrs.body.attributes.some((entry: { name: string }) => entry.name === "name")).toBe(true);

        const options = await request(harness.app.getHttpServer()).post("/repository-probes/generate-options");
        expect(options.status).toBe(200);
        expect(options.body.modelName).toBe("Museums");
        expect(options.body.hasInclude).toBe(true);
        expect(options.body.searchIncludeCount).toBeGreaterThan(0);

        const download = await request(harness.app.getHttpServer()).post("/repository-probes/download-csv");
        expect(download.status).toBe(200);
        expect(download.body.byteLength).toBeGreaterThan(0);
        expect(String(download.body.preview)).toContain("exports.name");

        const headersDownload = await request(harness.app.getHttpServer()).post(
            "/repository-probes/download-csv-headers"
        );
        expect(headersDownload.status).toBe(200);
        expect(String(headersDownload.body.preview)).toContain("exports.name");
        expect(String(headersDownload.body.preview)).toContain("Alpha");

        const typedCsv = await request(harness.app.getHttpServer()).post("/repository-probes/download-typed/csv");
        expect(typedCsv.status).toBe(200);
        expect(typedCsv.body.ok).toBe(true);
        expect(String(typedCsv.body.preview)).toContain("Probe");

        const typedXlsx = await request(harness.app.getHttpServer()).post("/repository-probes/download-typed/xlsx");
        expect(typedXlsx.status).toBe(200);
        expect(typedXlsx.body.ok).toBe(true);

        const typedHtml = await request(harness.app.getHttpServer()).post("/repository-probes/download-typed/html");
        expect(typedHtml.status).toBe(200);
        expect(typedHtml.body.ok).toBe(false);
        expect(String(typedHtml.body.message)).toMatch(/custom ExportAdapter/i);

        const typedPdf = await request(harness.app.getHttpServer()).post("/repository-probes/download-typed/pdf");
        expect(typedPdf.status).toBe(200);
        expect(typedPdf.body.ok).toBe(false);

        const typedZip = await request(harness.app.getHttpServer()).post("/repository-probes/download-typed/zip");
        expect(typedZip.status).toBe(200);
        expect(typedZip.body.ok).toBe(false);

        const searchCondition = await request(harness.app.getHttpServer())
            .post("/repository-probes/add-search-condition")
            .query({ q: "Repo", nested: "1" });
        expect(searchCondition.status).toBe(200);
        expect(searchCondition.body.hasInclude).toBe(true);
        expect(searchCondition.body.wrappedInAnd).toBe(true);

        const plainSearchCondition = await request(harness.app.getHttpServer())
            .post("/repository-probes/add-search-condition")
            .query({ q: "Repo" });
        expect(plainSearchCondition.status).toBe(200);
        expect(plainSearchCondition.body.hasInclude).toBe(false);
        expect(plainSearchCondition.body.wrappedInAnd).toBe(true);

        const emptySearch = await request(harness.app.getHttpServer())
            .post("/repository-probes/add-search-condition")
            .query({ q: "" });
        expect(emptySearch.status).toBe(200);
        expect(emptySearch.body.hasInclude).toBe(false);
        expect(emptySearch.body.wrappedInAnd).toBe(false);

        const plainAttr = await request(harness.app.getHttpServer()).get("/repository-probes/custom-attribute/name");
        expect(plainAttr.status).toBe(200);
        expect(plainAttr.body).toMatchObject({ has: false, attribute: null });

        const sumAttr = await request(harness.app.getHttpServer())
            .get("/repository-probes/custom-attribute/totalQuantity")
            .query({ source: "sum" });
        expect(sumAttr.status).toBe(200);
        expect(sumAttr.body).toMatchObject({ has: true, attribute: "sum" });
        expect(Array.isArray(sumAttr.body.groupBy)).toBe(true);
        expect(sumAttr.body.groupBy.length).toBeGreaterThan(0);

        const countAttr = await request(harness.app.getHttpServer())
            .get("/repository-probes/custom-attribute/lineCount")
            .query({ source: "count" });
        expect(countAttr.status).toBe(200);
        expect(countAttr.body).toMatchObject({ has: true, attribute: "count" });

        const translations = await request(harness.app.getHttpServer()).get("/repository-probes/search-attributes");
        expect(translations.status).toBe(200);
        expect(Array.isArray(translations.body.translations)).toBe(true);
    });

    /**
     * @p0 suspected-defect
     * Nested HasMany path attributes make repository.count() incompatible with
     * MySQL only_full_group_by.
     */
    it("reports the nested count only_full_group_by failure", async () => {
        await using museum = await createSeededMuseum({ name: "Nested Count Museum" });
        await using _artifact = await createSeededArtifact({
            museum_id: museum.id,
            title: "CountRelic",
            status: "on_display",
            display_rank: 1
        });

        const response = await request(harness.app.getHttpServer()).post("/repository-probes/count-nested");
        expect(response.status).toBe(200);
        expect(response.body.errored).toBe(true);
        expect(String(response.body.message)).toMatch(/only_full_group_by|ER_WRONG_FIELD_WITH_GROUP|nonaggregated/i);
    });

    it("applies access control on *FromUser repository methods", async () => {
        await using allowed = await createSeededMuseum({ name: "ACL Allowed Museum" });
        await using denied = await createSeededMuseum({ name: "ACL Denied Museum" });

        const user = { language: "fr", allowedPersonIds: [allowed.id] };

        const fromUser = await request(harness.app.getHttpServer())
            .post("/repository-probes/find-all-from-user")
            .set("x-test-user", JSON.stringify(user));
        expect(fromUser.status).toBe(200);
        expect(fromUser.body.ids).toEqual([allowed.id]);
        expect(fromUser.body.ids).not.toContain(denied.id);

        const byPkAllowed = await request(harness.app.getHttpServer())
            .get(`/repository-probes/by-pk-from-user/${allowed.id}`)
            .set("x-test-user", JSON.stringify(user));
        expect(byPkAllowed.status).toBe(200);
        expect(byPkAllowed.body.found).toBe(true);

        const byPkDenied = await request(harness.app.getHttpServer())
            .get(`/repository-probes/by-pk-from-user/${denied.id}`)
            .set("x-test-user", JSON.stringify(user));
        expect(byPkDenied.status).toBe(200);
        expect(byPkDenied.body.found).toBe(false);

        const findOneAllowed = await request(harness.app.getHttpServer())
            .post("/repository-probes/find-one-from-user")
            .query({ name: "ACL Allowed Museum" })
            .set("x-test-user", JSON.stringify(user));
        expect(findOneAllowed.status).toBe(200);
        expect(findOneAllowed.body).toEqual({ found: true, id: allowed.id });

        const findOneDenied = await request(harness.app.getHttpServer())
            .post("/repository-probes/find-one-from-user")
            .query({ name: "ACL Denied Museum" })
            .set("x-test-user", JSON.stringify(user));
        expect(findOneDenied.status).toBe(200);
        expect(findOneDenied.body.found).toBe(false);

        const countFromUser = await request(harness.app.getHttpServer())
            .post("/repository-probes/count-from-user")
            .set("x-test-user", JSON.stringify(user));
        // Observed: countFromUser with fromIds ACL can succeed while plain count() 500s
        // under only_full_group_by (different Sequelize COUNT SQL shape).
        expect(countFromUser.status).toBe(200);
        expect(countFromUser.body.total).toBe(1);

        const searchFromUser = await request(harness.app.getHttpServer())
            .post("/repository-probes/search-from-user")
            .query({ q: "ACL" })
            .set("x-test-user", JSON.stringify(user));
        expect(searchFromUser.status).toBe(200);
        expect(searchFromUser.body.ids).toEqual([allowed.id]);
    });
});
