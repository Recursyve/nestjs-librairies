import {
    DateOperators,
    FilterOperatorTypes,
    FilterResultModelMixin,
    FilterUtils,
    NullOperators,
    NumberOperators,
    PageModel,
    SelectOperators,
    StringOperators
} from "@recursyve/nestjs-data-filter";
import { describe, expect, it } from "vitest";

describe("exported operator lists and public utilities", () => {
    it("exposes the committed operator const arrays", () => {
        expect(SelectOperators).toEqual([FilterOperatorTypes.Equal, FilterOperatorTypes.NotEqual]);
        expect(StringOperators).toEqual([
            FilterOperatorTypes.Equal,
            FilterOperatorTypes.NotEqual,
            FilterOperatorTypes.Contains,
            FilterOperatorTypes.BeginsWith,
            FilterOperatorTypes.NotBeginsWith,
            FilterOperatorTypes.EndsWith,
            FilterOperatorTypes.NotEndsWith
        ]);
        expect(NumberOperators).toEqual([
            FilterOperatorTypes.Equal,
            FilterOperatorTypes.NotEqual,
            FilterOperatorTypes.Greater,
            FilterOperatorTypes.GreaterOrEqual,
            FilterOperatorTypes.Less,
            FilterOperatorTypes.LessOrEqual
        ]);
        expect(DateOperators).toEqual([
            ...NumberOperators,
            FilterOperatorTypes.Between,
            FilterOperatorTypes.NotBetween
        ]);
        expect(NullOperators).toEqual([FilterOperatorTypes.IsNull, FilterOperatorTypes.IsNotNull]);
    });

    it("builds FilterResultModelMixin and PageModel as public runtime constructors", () => {
        class HarborNoticeDto {
            headline!: string;
        }

        const Mixed = FilterResultModelMixin(HarborNoticeDto);
        expect(Mixed.name).toBe("HarborNoticeDtoFilterResultModel");
        const instance = new Mixed();
        instance.values = [];
        instance.total = 0;
        instance.page = new PageModel();
        instance.page.number = 0;
        instance.page.size = 20;
        expect(instance.total).toBe(0);
        expect(instance.page.size).toBe(20);
    });

    it("exposes FilterUtils translation key helpers", () => {
        expect(FilterUtils.getFilterTranslationKey("headline")).toBe("filter.headline.name");
        expect(FilterUtils.getOperatorTranslationKey("equal")).toBe("data_filter.filter.operators.equal");
        expect(FilterUtils.getRadioOptionTranslationKey("status", "open")).toBe("filter.status.options.open");
        expect(FilterUtils.getGroupTranslationKey("geo")).toBe("data_filter.filter.groups.geo");
        expect(FilterUtils.getCustomOperatorTranslationKey("visits", "none")).toBe("filter.visits.operators.none");
        expect(FilterUtils.getProviderToken(class SampleFilter {})).toBe("SampleFilterService");
    });
});
