export interface ExportData {
    title: string;
    data: object[];
    columns: string[];
}

export abstract class ExportAdapter {
    public abstract exportAsHtml(language: string, data: ExportData, options?: any): Promise<string>;
    public abstract exportAsPdf(language: string, data: ExportData, options?: any): Promise<Buffer>;
}
