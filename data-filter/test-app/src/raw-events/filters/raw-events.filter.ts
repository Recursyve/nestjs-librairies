import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, SearchableAttributes, TextFilter } from "@recursyve/nestjs-data-filter";
import { RawEvents } from "../models/raw-events.model";

@Data(RawEvents)
@Attributes(["event_name", "source"])
@SearchableAttributes(["event_name", "source"])
export class RawEventsData {}

@Injectable()
export class RawEventsFilter extends BaseFilter<RawEventsData> {
    public readonly dataDefinition = RawEventsData;

    public readonly eventName = new TextFilter({ attribute: "event_name" });
    public readonly source = new TextFilter({ attribute: "source" });
}
