import { Inject, Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    DefaultFilter,
    FilterOperatorTypes,
    SearchableAttributes,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { GUILD_REGION_TOKEN } from "../guild-region.token";
import { GuildCharters } from "../models/guild-charters.model";

@Data(GuildCharters)
@Attributes(["guild_name", "region"])
@SearchableAttributes(["guild_name"])
export class GuildChartersData {}

/**
 * Characterizes forFeature filters[].inject: the filter factory receives the
 * injected region token and scopes the default filter to that region.
 */
@Injectable()
export class GuildChartersFilter extends BaseFilter<GuildChartersData> {
    public readonly dataDefinition = GuildChartersData;

    public readonly guildName = new TextFilter({ attribute: "guild_name" });
    public readonly region = new TextFilter({ attribute: "region" });

    public readonly defaultFilter: DefaultFilter;

    constructor(@Inject(GUILD_REGION_TOKEN) public readonly injectedRegion: string) {
        super();

        this.defaultFilter = new DefaultFilter(
            {
                id: "region",
                operation: FilterOperatorTypes.Equal,
                value: injectedRegion
            },
            true
        );
    }
}
