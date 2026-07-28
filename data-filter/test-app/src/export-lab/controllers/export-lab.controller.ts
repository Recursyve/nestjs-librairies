import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { ExportLabData, ExportLabFilter } from "../filters/export-lab.filter";

@Controller("export-lab")
export class ExportLabController extends FilterController<ExportLabData> {
    constructor(@InjectFilter(ExportLabFilter) filterService: FilterService<ExportLabData>) {
        super(filterService);
    }
}
