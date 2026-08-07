import { Body, Controller, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import {
    ExportTypes,
    FilterQueryModel,
    FilterService,
    InjectFilter
} from "@recursyve/nestjs-data-filter";
import { HarborNoticesData, HarborNoticesFilter } from "../../harbor-notices/filters/harbor-notices.filter";

type HarborExportProbeBody = {
    exportOptions?: object;
    language?: string;
    query?: FilterQueryModel;
};

/**
 * Characterizes FilterService.downloadData `exportOptions` + `user.language`
 * forwarding into a consumer ExportAdapter (not exposed by FilterController).
 */
@Controller("harbor-export-probes")
export class HarborExportProbeController {
    constructor(
        @InjectFilter(HarborNoticesFilter) private readonly filterService: FilterService<HarborNoticesData>
    ) {}

    @Post("download/:type")
    @HttpCode(HttpStatus.OK)
    public async downloadWithOptions(
        @Param("type") type: ExportTypes,
        @Body() body: HarborExportProbeBody
    ): Promise<{ text: string }> {
        const result = await this.filterService.downloadData({
            exportOptions: body.exportOptions,
            options: body.query ?? {
                page: { number: 0, size: 20 },
                query: { condition: "and", rules: [] }
            },
            request: {},
            type,
            user: { language: body.language ?? "fr" }
        });

        return {
            text: Buffer.isBuffer(result) ? result.toString("utf8") : String(result)
        };
    }
}
