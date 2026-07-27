import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { ContractSystemsData, ContractSystemsFilter } from "./filters/contract-systems.filter";

@Controller("contract-systems")
export class ContractSystemsController extends FilterController<ContractSystemsData> {
    constructor(@InjectFilter(ContractSystemsFilter) filterService: FilterService<ContractSystemsData>) {
        super(filterService);
    }
}
