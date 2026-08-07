import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    FilterOperatorTypes,
    SearchableAttributes,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { SpellScrolls } from "../models/spell-scrolls.model";

@Data(SpellScrolls)
@Attributes(["title", "mana_cost"])
@SearchableAttributes(["title"])
export class SpellScrollsData {}

/**
 * Characterizes Filter.addOperators / removeOperators / setOperators on the
 * public filter configuration surface.
 */
@Injectable()
export class SpellScrollsFilter extends BaseFilter<SpellScrollsData> {
    public readonly dataDefinition = SpellScrollsData;

    public readonly title = new TextFilter({ attribute: "title" })
        .removeOperators(FilterOperatorTypes.EndsWith, FilterOperatorTypes.NotEndsWith)
        .addOperators({ name: "exact_title", operator: FilterOperatorTypes.Equal });

    public readonly manaCost = new TextFilter({ attribute: "mana_cost" }).setOperators(
        FilterOperatorTypes.Equal,
        FilterOperatorTypes.Greater
    );
}
