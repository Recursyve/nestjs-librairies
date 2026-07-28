import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, FilterOperatorTypes, TextFilter } from "@recursyve/nestjs-data-filter";
import { StoryArcs } from "../models/story-arcs.model";

@Data(StoryArcs)
@Attributes(["title", "genre"])
export class StoryArcsData {}

@Injectable()
export class StoryArcsFilter extends BaseFilter<StoryArcsData> {
    public readonly dataDefinition = StoryArcsData;

    public readonly genre = new TextFilter({ attribute: "genre" });

    public readonly title = new TextFilter({
        attribute: "title",
        condition: {
            condition: "and",
            rules: [
                {
                    condition: "and",
                    rules: [
                        {
                            key: "genre",
                            value: "sci-fi",
                            operation: FilterOperatorTypes.Equal
                        }
                    ]
                }
            ]
        }
    });
}
