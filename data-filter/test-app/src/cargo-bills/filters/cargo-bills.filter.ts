import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, SearchableAttributes, TextFilter } from "@recursyve/nestjs-data-filter";
import { CargoBills } from "../models/cargo-bills.model";

/**
 * Full listing shape (includes confidential_note).
 */
@Data(CargoBills)
@Attributes(["bill_code", "shipper", "confidential_note"])
@SearchableAttributes(["bill_code", "shipper"])
export class CargoBillsData {}

/**
 * Export-only shape: confidential_note is intentionally omitted so the export
 * repository cannot load it when exportDataDefinition is set.
 */
@Data(CargoBills)
@Attributes(["bill_code", "shipper"])
export class CargoBillsExportData {}

@Injectable()
export class CargoBillsFilter extends BaseFilter<CargoBillsData> {
    public readonly dataDefinition = CargoBillsData;
    public readonly exportDataDefinition = CargoBillsExportData;

    public readonly billCode = new TextFilter({ attribute: "bill_code" });

    /**
     * Forces the getExportedFields path so downloaded rows come from
     * exportRepository (exportDataDefinition) rather than @Exports on
     * dataDefinition. Observed: without this override, downloadData uses
     * repository.exportColumns from dataDefinition (which has none) → empty CSV.
     */
    public override async getExportedFieldsKeys(): Promise<string[]> {
        return Promise.resolve(["bill_code", "shipper", "confidential_note"]);
    }

    public override async getExportedFields(value: CargoBillsData): Promise<string[]> {
        const row = value as unknown as {
            bill_code?: string;
            shipper?: string;
            confidential_note?: string;
        };
        return Promise.resolve([row.bill_code ?? "", row.shipper ?? "", row.confidential_note ?? "MISSING"]);
    }
}
