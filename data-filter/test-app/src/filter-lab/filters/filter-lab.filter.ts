import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, TextFilter } from "@recursyve/nestjs-data-filter";
import { FilterLabRows } from "../models/filter-lab-rows.model";

@Data(FilterLabRows)
@Attributes(["code", "detail_note"])
export class FilterLabDetailData {}

@Data(FilterLabRows)
@Attributes(["code"])
export class FilterLabSummaryData {}

@Injectable()
export class FilterLabFilter extends BaseFilter<FilterLabDetailData> {
    public readonly dataDefinition = FilterLabDetailData;

    public readonly code = new TextFilter({ attribute: "code" });
    public readonly detailNote = new TextFilter({ attribute: "detail_note" });
}
