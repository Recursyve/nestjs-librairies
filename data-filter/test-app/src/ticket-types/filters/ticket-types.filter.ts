import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, TextFilter } from "@recursyve/nestjs-data-filter";
import { TicketTypes } from "../models/ticket-types.model";

@Data(TicketTypes)
@Attributes(["code", "label"])
export class TicketTypesData {}

@Injectable()
export class TicketTypesFilter extends BaseFilter<TicketTypesData> {
    public readonly dataDefinition = TicketTypesData;

    public readonly code = new TextFilter({ attribute: "code" });
    public readonly label = new TextFilter({ attribute: "label" });
}
