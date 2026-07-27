import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    EnumOrderRule,
    IfOrderRule,
    Include,
    IsNullOrderRule,
    NumberFilter,
    SearchableAttributes,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { Coords } from "../../coords/models/coords.model";
import { Persons } from "../models/persons.model";

@Data(Persons)
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

    public readonly city = new TextFilter({ attribute: "value", path: "coord.location" });
    public readonly email = new TextFilter({ attribute: "email" });
    public readonly firstName = new TextFilter({ attribute: "first_name" });
    public readonly lastName = new TextFilter({ attribute: "last_name" });
    public readonly postalCode = new TextFilter({ attribute: "postal_code", path: "coord" });
    public readonly stock = new NumberFilter({ attribute: "id" });

    public readonly statusOrder = new EnumOrderRule({
        attribute: "last_name",
        priorities: ["Alpha", "Beta", "Gamma"]
    });

    public readonly lastNameNullOrder = new IsNullOrderRule({
        attribute: "last_name"
    });

    public readonly emailIfOrder = new IfOrderRule({
        attribute: "email",
        valueEquals: "alice@example.com",
        priority: 1,
        fallbackPriority: 0
    });
}
