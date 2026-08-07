import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CustomExportHarness } from "./harness/custom-export-harness";
import { TestHarness } from "./harness/test-harness";
import { createSeededHarborNotice } from "./seeds/create-seeded-harbor-notice";

function parseHarborExportProbe(payload: string): { language: unknown; options: unknown } {
    const scriptMatch = /id="harbor-export">([^<]+)</.exec(payload);
    const raw = scriptMatch?.[1] ?? /({"language":.*})$/.exec(payload)?.[1];
    if (!raw) {
        throw new Error(`Harbor export probe marker missing in: ${payload}`);
    }
    return JSON.parse(raw) as { language: unknown; options: unknown };
}

describe("custom ExportAdapter happy path", () => {
    let harness: CustomExportHarness;

    beforeAll(async () => {
        harness = await CustomExportHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("downloads html/pdf/zip successfully through a consumer ExportAdapter", async () => {
        await using notice = await createSeededHarborNotice({ headline: "Export Probe", priority: 3 });

        const html = await harness.postDownload("harbor-notices", "html", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(html.status).toBe(200);
        expect(String(html.text)).toContain("<html>");
        expect(String(html.text)).toContain("harbor_notices");

        const pdf = await harness.postDownloadBinary("harbor-notices", "pdf", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(pdf.status).toBe(200);
        expect(Buffer.isBuffer(pdf.body)).toBe(true);
        expect((pdf.body as Buffer).toString("utf8")).toContain("PDF:");

        const zip = await harness.postDownloadBinary("harbor-notices", "zip", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(zip.status).toBe(200);
        expect((zip.body as Buffer).toString("utf8")).toContain("ZIP:");
        expect(notice.id).toBeGreaterThan(0);
    });

    it("FilterController download does not supply exportOptions to the adapter", async () => {
        await using _notice = await createSeededHarborNotice({ headline: "No Options", priority: 1 });

        const html = await harness.postDownload("harbor-notices", "html", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(html.status).toBe(200);
        expect(parseHarborExportProbe(String(html.text))).toEqual({ language: "fr", options: null });

        const pdf = await harness.postDownloadBinary("harbor-notices", "pdf", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(pdf.status).toBe(200);
        /**
         * @p0 suspected-defect
         * DataFilterRepository.downloadData calls downloadPdf/downloadZip as
         * (headers, data, options) — dropping `lang`. With no exportOptions,
         * the adapter receives language=null and options=null.
         */
        expect(parseHarborExportProbe((pdf.body as Buffer).toString("utf8"))).toEqual({
            language: null,
            options: null
        });
    });
});

/**
 * FilterService.downloadData accepts `exportOptions` and `user.language` and
 * forwards them into ExportAdapter — except PDF/ZIP via downloadData, which
 * currently swap/drop arguments (suspected-defect).
 */
describe("FilterService.downloadData exportOptions forwarding", () => {
    let harness: CustomExportHarness;

    beforeAll(async () => {
        harness = await CustomExportHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("forwards language and exportOptions to exportAsHtml", async () => {
        await using _notice = await createSeededHarborNotice({ headline: "Html Options", priority: 2 });

        const response = await harness.postExportProbe("html", {
            language: "en",
            exportOptions: { stamp: "harbor-seal", margin: 12 }
        });

        expect(response.status).toBe(200);
        expect(parseHarborExportProbe(response.body.text)).toEqual({
            language: "en",
            options: { stamp: "harbor-seal", margin: 12 }
        });
    });

    /**
     * @p0 suspected-defect
     * downloadData(PDF/ZIP) invokes downloadPdf/Zip(headers, data, options),
     * so `exportOptions` lands in the adapter `language` argument and the
     * adapter `options` argument stays undefined. `user.language` is dropped.
     */
    it.each(["pdf", "zip"] as const)(
        "forwards exportOptions into language (not options) for %s",
        async (type) => {
            await using _notice = await createSeededHarborNotice({
                headline: `${type} Options`,
                priority: 4
            });

            const exportOptions = { stamp: "harbor-seal", margin: 12 };
            const response = await harness.postExportProbe(type, {
                language: "en",
                exportOptions
            });

            expect(response.status).toBe(200);
            expect(parseHarborExportProbe(response.body.text)).toEqual({
                language: exportOptions,
                options: null
            });
        }
    );
});
