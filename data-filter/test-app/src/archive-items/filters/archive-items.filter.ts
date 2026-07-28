import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, TextFilter } from "@recursyve/nestjs-data-filter";
import { ArchiveItems } from "../models/archive-items.model";

@Data(ArchiveItems)
@Attributes(["title", "status"])
export class ArchiveItemsData {}

@Injectable()
export class ArchiveItemsFilter extends BaseFilter<ArchiveItemsData> {
    public readonly dataDefinition = ArchiveItemsData;

    public readonly title = new TextFilter({ attribute: "title", paranoid: false });

    public readonly status = new TextFilter({ attribute: "status" });
}
