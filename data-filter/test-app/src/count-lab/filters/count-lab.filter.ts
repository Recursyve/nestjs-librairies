import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Count, Data, NumberFilter, TextFilter } from "@recursyve/nestjs-data-filter";
import { col, fn } from "sequelize";
import { CountLabParents } from "../models/count-lab-parents.model";

@Data(CountLabParents)
@Attributes(["code"])
@Count("childCount", { attribute: "id", path: "children" })
export class CountLabData {}

@Injectable()
export class CountLabFilter extends BaseFilter<CountLabData> {
    public readonly dataDefinition = CountLabData;

    public readonly code = new TextFilter({ attribute: "code" });

    public readonly minChildren = new NumberFilter({
        attribute: "id",
        path: "children",
        group: "children",
        having: fn("count", col("children.id"))
    });
}
