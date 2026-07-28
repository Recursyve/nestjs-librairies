import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { ContractsData, ContractsFilter } from "../filters/contracts.filter";

@Controller("contracts")
export class ContractsController extends FilterController<ContractsData> {
    constructor(@InjectFilter(ContractsFilter) filterService: FilterService<ContractsData>) {
        super(filterService);
    }
}
