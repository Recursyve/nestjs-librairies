import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    SelectFilter,
    SelectFilterValue,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { MemberTiers } from "../models/member-tiers.model";

const tierOptions: SelectFilterValue[] = [
    { id: "bronze", name: "Bronze" },
    { id: "silver", name: "Silver" },
    { id: "gold", name: "Gold" },
    { id: "platinum", name: "Platinum" }
];

@Data(MemberTiers)
@Attributes(["tier_code", "label"])
export class MemberTiersData {}

@Injectable()
export class MemberTiersFilter extends BaseFilter<MemberTiersData> {
    public readonly dataDefinition = MemberTiersData;

    public readonly label = new TextFilter({ attribute: "label" });

    public readonly tierSelect = new SelectFilter({
        attribute: "tier_code",
        lazyLoading: true,
        values: async ({ page, pageSize }) => {
            const pageNumber = page ?? 0;
            const size = pageSize ?? 2;
            const start = pageNumber * size;
            return tierOptions.slice(start, start + size);
        },
        getResourceById: async ({ id }) => tierOptions.find((tier) => tier.id === id) ?? null
    });
}
