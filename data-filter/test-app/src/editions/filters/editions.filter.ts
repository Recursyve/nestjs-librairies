import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    DefaultOrderRule,
    JsonOrderRule,
    SearchableAttributes,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { Editions } from "../models/editions.model";

@Data(Editions)
@Attributes(["code", "title", "status"])
@SearchableAttributes(["code", "title"])
export class EditionsData {}

@Injectable()
export class EditionsFilter extends BaseFilter<EditionsData> {
    public readonly dataDefinition = EditionsData;

    public readonly defaultOrderRule = new DefaultOrderRule({ column: "code", direction: "asc" });

    public readonly code = new TextFilter({ attribute: "code" });
    public readonly title = new TextFilter({ attribute: "title" });
    public readonly status = new TextFilter({ attribute: "status" });

    public readonly imprintOrder = new JsonOrderRule({
        attribute: "metadata",
        json: { type: "object", path: "imprint" }
    });
}
