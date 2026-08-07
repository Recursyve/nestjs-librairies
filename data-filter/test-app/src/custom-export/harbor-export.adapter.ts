import { Injectable } from "@nestjs/common";
import { ExportAdapter, ExportData } from "@recursyve/nestjs-data-filter";

/**
 * Custom ExportAdapter that succeeds for html/pdf/zip and echoes `language` /
 * `options` into the payload so Phase 0 can characterize forwarding.
 */
@Injectable()
export class HarborExportAdapter extends ExportAdapter {
    public async exportAsHtml(language: string, data: ExportData, options?: unknown): Promise<string> {
        return Promise.resolve(
            `<html><title>${data.title}</title><body>${data.columns.join(",")}:${data.data.length}</body>` +
                `<script type="application/json" id="harbor-export">${this.encodeProbe(language, options)}</script></html>`
        );
    }

    public async exportAsPdf(language: string, data: ExportData, options?: unknown): Promise<Buffer> {
        return Promise.resolve(
            Buffer.from(`PDF:${data.title}:${data.data.length}:${this.encodeProbe(language, options)}`, "utf8")
        );
    }

    public async exportAsZip(language: string, data: ExportData, options?: unknown): Promise<Buffer> {
        return Promise.resolve(
            Buffer.from(`ZIP:${data.title}:${data.data.length}:${this.encodeProbe(language, options)}`, "utf8")
        );
    }

    private encodeProbe(language: unknown, options?: unknown): string {
        return JSON.stringify({ language: language ?? null, options: options ?? null });
    }
}
