import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, GeoBoundsFilter, TextFilter } from "@recursyve/nestjs-data-filter";
import { Systems } from "../models/systems.model";

@Data(Systems)
@Attributes(["file_number", "latitude", "longitude"])
export class SystemsData {}

@Injectable()
export class SystemsFilter extends BaseFilter<SystemsData> {
    public readonly dataDefinition = SystemsData;

    public readonly fileNumber = new TextFilter({ attribute: "file_number" });

    public readonly geoBounds = new GeoBoundsFilter({
        latAttribute: "latitude",
        lngAttribute: "longitude",
        srid: 4326
    });
}
