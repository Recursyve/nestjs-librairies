import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    DefaultFilter,
    FilterOperatorTypes,
    SearchableAttributes,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { Subscribers } from "../models/subscribers.model";

@Data(Subscribers)
@Attributes(["email", "display_name"])
@SearchableAttributes(["email", "display_name"])
export class SubscribersData {}

@Injectable()
export class SubscribersFilter extends BaseFilter<SubscribersData> {
    public readonly dataDefinition = SubscribersData;

    public readonly defaultFilter = new DefaultFilter(
        {
            id: "email",
            operation: FilterOperatorTypes.Contains,
            value: "@"
        },
        true
    );

    public readonly email = new TextFilter({ attribute: "email" });
    public readonly displayName = new TextFilter({ attribute: "display_name" });
}
