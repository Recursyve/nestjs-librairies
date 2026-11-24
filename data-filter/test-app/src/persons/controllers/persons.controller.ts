import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { PersonsData, PersonsFilter } from "../filters/persons.filter";

@Controller("persons")
export class PersonsController extends FilterController<PersonsData> {
    constructor(@InjectFilter(PersonsFilter) filterService: FilterService<PersonsData>) {
        super(filterService);
    }
}
