import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, ExportTypes, TextFilter } from "@recursyve/nestjs-data-filter";
import { ExportLabRows } from "../models/export-lab-rows.model";

@Data(ExportLabRows)
@Attributes(["code", "label_fr", "label_en"])
export class ExportLabData {}

@Injectable()
export class ExportLabFilter extends BaseFilter<ExportLabData> {
    public readonly dataDefinition = ExportLabData;

    public readonly code = new TextFilter({ attribute: "code" });

    public override async getExportedFieldsKeys(_type?: ExportTypes): Promise<string[]> {
        return Promise.resolve(["localized_label"]);
    }

    public override async getExportedFields(
        value: ExportLabData,
        lang?: string,
        _type?: ExportTypes
    ): Promise<string[]> {
        const row = value as unknown as ExportLabRows;
        return Promise.resolve([lang === "en" ? (row.label_en ?? "") : (row.label_fr ?? "")]);
    }
}
