import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { ArchiveItemsData, ArchiveItemsFilter } from "../filters/archive-items.filter";

@Controller("archive-items")
export class ArchiveItemsController extends FilterController<ArchiveItemsData> {
    constructor(@InjectFilter(ArchiveItemsFilter) filterService: FilterService<ArchiveItemsData>) {
        super(filterService);
    }
}
