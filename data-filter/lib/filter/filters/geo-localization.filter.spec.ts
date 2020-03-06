import { GeoLocalizationFilter } from "./geo-localization.filter";
import { CoordinateFilter } from "./coordinate.filter";
import { FilterOperatorTypes } from "../operators";
import { FindAttributeOptions, fn, literal, Op, WhereOptions } from "sequelize";
import { GroupFilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { FilterType } from "../type";
import { RuleModel } from "../models";

describe("GeoLocalizationFilter", () => {
    describe("getConfig", () => {
        it("should return a valid config", async () => {
            const filter = new GeoLocalizationFilter({
                rootFilter: new CoordinateFilter({
                    attribute: "test"
                })
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<GroupFilterBaseConfigurationModel>({
                type: FilterType.GeoLocalization,
                rootFilter: {
                    type: FilterType.Coordinate,
                    operators: [
                        {
                            "id": "equal",
                            "name": "equal"
                        },
                        {
                            "id": "not_equal",
                            "name": "not_equal"
                        }
                    ]
                },
                valueFilter: {
                    type: FilterType.Number,
                    operators: [
                        {
                            "id": "equal",
                            "name": "equal"
                        },
                        {
                            "id": "not_equal",
                            "name": "not_equal"
                        },
                        {
                            "id": "greater",
                            "name": "greater"
                        },
                        {
                            "id": "greater_or_equal",
                            "name": "greater_or_equal"
                        },
                        {
                            "id": "less",
                            "name": "less"
                        },
                        {
                            "id": "less_or_equal",
                            "name": "less_or_equal"
                        }
                    ]
                },
                lazyLoading: false
            });
        });

        it("with group should return a valid config", async () => {
            const filter = new GeoLocalizationFilter({
                rootFilter: new CoordinateFilter({
                    attribute: "test"
                }),
                group: "test"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<GroupFilterBaseConfigurationModel>({
                type: FilterType.GeoLocalization,
                rootFilter: {
                    type: FilterType.Coordinate,
                    operators: [
                        {
                            "id": "equal",
                            "name": "equal"
                        },
                        {
                            "id": "not_equal",
                            "name": "not_equal"
                        }
                    ]
                },
                valueFilter: {
                    type: FilterType.Number,
                    operators: [
                        {
                            "id": "equal",
                            "name": "equal"
                        },
                        {
                            "id": "not_equal",
                            "name": "not_equal"
                        },
                        {
                            "id": "greater",
                            "name": "greater"
                        },
                        {
                            "id": "greater_or_equal",
                            "name": "greater_or_equal"
                        },
                        {
                            "id": "less",
                            "name": "less"
                        },
                        {
                            "id": "less_or_equal",
                            "name": "less_or_equal"
                        }
                    ]
                },
                lazyLoading: false,
                group: {
                    name: "test",
                    key: "test"
                }
            });
        });
    });

    describe("getWhereOptions", () => {
        beforeEach(() => {
            GeoLocalizationFilter.reset();
        });

        it("should return a valid filter config", async () => {
            const filter = new GeoLocalizationFilter({
                rootFilter: new CoordinateFilter({
                    attribute: "test"
                })
            });
            const options = await filter.getWhereOptions({
                id: "test",
                value: [
                    {
                        operation: FilterOperatorTypes.Equal,
                        value: [45.8797953, -73.2815516]
                    },
                    {
                        operation: FilterOperatorTypes.LessOrEqual,
                        value: 1000
                    }
                ] as [RuleModel, RuleModel],
                operation: FilterOperatorTypes.Equal
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                test_distance_0: {
                    [Op.lte]: 1000
                }
            });
        });
    });

    describe("getAttributesOptions", () => {
        beforeEach(() => {
            GeoLocalizationFilter.reset();
        });

        it("should return a valid filter config", async () => {
            const filter = new GeoLocalizationFilter({
                rootFilter: new CoordinateFilter({
                    attribute: "test"
                })
            });
            const options = await filter.getAttributeOptions({
                id: "test",
                value: [
                    {
                        operation: FilterOperatorTypes.Equal,
                        value: [45.8797953, -73.2815516]
                    },
                    {
                        operation: FilterOperatorTypes.LessOrEqual,
                        value: 1000
                    }
                ] as [RuleModel, RuleModel],
                operation: FilterOperatorTypes.Equal
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<FindAttributeOptions>([
                [
                    fn("ST_Distance_Sphere", literal("test"), literal(`point(${45.8797953}, ${-73.2815516})`)),
                    "test_distance_0"
                ]
            ]);
        });
    });
});
