import { Injectable } from "@nestjs/common";
import { ExportAdapter, ExportData } from "./export.adapter";

@Injectable()
export class DefaultExportAdapter extends ExportAdapter {
    public exportAsHtml(language: string, data: ExportData, options?: any): Promise<string> {
        throw new Error("DataFilter doesn't provide a default HTML export. To enable it, add a custom ExportAdapter");
    }

    public exportAsPdf(language: string, data: ExportData, options?: any): Promise<Buffer> {
        throw new Error("DataFilter doesn't provide a default PDF export. To enable it, add a custom ExportAdapter");
    }
}
