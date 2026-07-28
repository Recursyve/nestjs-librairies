import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, FilterOperatorTypes, TextFilter } from "@recursyve/nestjs-data-filter";
import { ProfileCaptions } from "../models/profile-captions.model";

@Data(ProfileCaptions)
@Attributes(["caption", "category"])
export class ProfileCaptionsData {}

@Injectable()
export class ProfileCaptionsFilter extends BaseFilter<ProfileCaptionsData> {
    public readonly dataDefinition = ProfileCaptionsData;

    public readonly caption = new TextFilter({
        attribute: "caption",
        condition: {
            condition: "and",
            rules: [
                {
                    key: "category",
                    value: "fiction",
                    operation: FilterOperatorTypes.Equal
                }
            ]
        }
    });

    public readonly category = new TextFilter({ attribute: "category" });
}
