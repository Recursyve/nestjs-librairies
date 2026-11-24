import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    Exports,
    Include,
    NumberFilter,
    SearchableAttributes,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { Coords } from "../../coords/models/coords.model";
import { Persons } from "../models/persons.model";

@Data(Persons)
@Exports(["email", "first_name", "last_name"])
@Attributes(["first_name", "last_name", "email"])
@SearchableAttributes(["first_name", "last_name", "email"])
export class PersonsData {
    @Attributes(["address", "postal_code", "cellphone"])
    @SearchableAttributes(["address", "postal_code"])
    @Include("location", {
        attributes: ["value", "unique_code"],
        searchableAttributes: ["value", "unique_code"]
    })
    coord?: Coords;
}

@Injectable()
export class PersonsFilter extends BaseFilter<PersonsData> {
    public readonly dataDefinition = PersonsData;

    public readonly email = new TextFilter({ attribute: "email" });
    public readonly firstName = new TextFilter({ attribute: "first_name" });
    public readonly lastName = new TextFilter({ attribute: "last_name" });
    public readonly stock = new NumberFilter({ attribute: "id" });
}
