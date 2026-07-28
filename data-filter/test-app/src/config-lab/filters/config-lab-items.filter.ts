import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, TextFilter } from "@recursyve/nestjs-data-filter";
import { ConfigLabItems } from "../models/config-lab-items.model";

@Data(ConfigLabItems)
@Attributes(["label", "secret_code"])
export class ConfigLabItemsData {}

@Injectable()
export class ConfigLabItemsFilter extends BaseFilter<ConfigLabItemsData> {
    public readonly dataDefinition = ConfigLabItemsData;

    public readonly label = new TextFilter({ attribute: "label" });

    public readonly hiddenSecret = new TextFilter({
        attribute: "secret_code",
        enabled: async () => Promise.resolve(false)
    });
}
