import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { FilterLabDetailData, FilterLabFilter, FilterLabSummaryData } from "../filters/filter-lab.filter";

@Controller("filter-lab")
export class FilterLabController extends FilterController<FilterLabDetailData> {
    constructor(@InjectFilter(FilterLabFilter) filterService: FilterService<FilterLabDetailData>) {
        super(filterService);
    }

    @Get("for-data-summary")
    @HttpCode(HttpStatus.OK)
    public async forDataSummary(): Promise<{ codes: string[]; hasDetailNote: boolean }> {
        const summaryService = this.filterService.forData(FilterLabSummaryData);
        const result = await summaryService.filter({
            options: {
                page: { number: 0, size: 20 },
                query: { condition: "and", rules: [] }
            },
            request: {},
            user: null
        });

        const values = result.values as Array<{ code?: string; detail_note?: string }>;
        return {
            codes: values.map((row) => row.code ?? ""),
            hasDetailNote: values.some((row) => "detail_note" in row && row.detail_note !== undefined)
        };
    }
}
