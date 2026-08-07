import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { CargoBillsData, CargoBillsFilter } from "../filters/cargo-bills.filter";

@Controller("cargo-bills")
export class CargoBillsController extends FilterController<CargoBillsData> {
    constructor(@InjectFilter(CargoBillsFilter) filterService: FilterService<CargoBillsData>) {
        super(filterService);
    }
}
