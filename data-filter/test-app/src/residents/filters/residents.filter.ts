import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    IgnoreInSearch,
    Include,
    SearchableAttributes,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { ResidentAddresses } from "../../resident-addresses/models/resident-addresses.model";
import { Residents } from "../models/residents.model";

@Data(Residents)
@Attributes(["full_name", "email"])
@SearchableAttributes(["full_name", "email"])
export class ResidentsData {
    @IgnoreInSearch()
    @Attributes(["street", "postal_code"])
    @SearchableAttributes(["street", "postal_code"])
    @Include("location", {
        attributes: ["value", "unique_code"],
        searchableAttributes: ["value", "unique_code"]
    })
    address?: ResidentAddresses;
}

@Injectable()
export class ResidentsFilter extends BaseFilter<ResidentsData> {
    public readonly dataDefinition = ResidentsData;

    public readonly fullName = new TextFilter({ attribute: "full_name" });
    public readonly postalCode = new TextFilter({ attribute: "postal_code", path: "address" });
}
