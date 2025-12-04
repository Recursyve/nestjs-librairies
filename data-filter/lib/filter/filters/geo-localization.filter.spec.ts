import { DefaultAccessControlAdapter, DefaultExportAdapter } from "../../adapters";
import { DefaultTranslateAdapter } from "../../adapters/default-translate.adapter";
import { FilterUtils } from "../filter.utils";
import { GeoLocalizationFilter } from "./geo-localization.filter";
import { CoordinateFilter } from "./coordinate.filter";
import { FilterOperatorTypes } from "../operators";
import { FindOptions, fn, literal, Op, where, WhereOptions } from "sequelize";
import { GroupFilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { FilterType } from "../type";
import { RuleModel } from "../models";
import { Data } from "../../decorators";
import { Coords } from "../../test/models/coords/coords.model";
import { BaseFilter } from "../base-filter";
import { FilterService } from "../filter.service";
import { SequelizeModelScanner } from "../../scanners/sequelize-model.scanner";
import { DataFilterService } from "../../data-filter.service";
import { DataFilterScanner } from "../../scanners/data-filter.scanner";
import { Locations } from "../../test/models/locations/locations.model";

describe("GeoLocalizationFilter", () => {
    describe("getConfig", () => {
        it("should return a valid config", async () => {
            const filter = new GeoLocalizationFilter({
                rootFilter: new CoordinateFilter({
                    attribute: "test"
                })
            });
            filter.translateService = new DefaultTranslateAdapter();
            const config = await filter.getConfig("", {});
            expect(config).toBeDefined();
            expect(config).toStrictEqual<GroupFilterBaseConfigurationModel>({
                type: FilterType.GeoLocalization,
                rootFilter: {
                    type: FilterType.Coordinate,
                    operators: [
                        {
                            id: "equal",
                            name: FilterUtils.getOperatorTranslationKey("equal")
                        },
                        {
                            id: "not_equal",
                            name: FilterUtils.getOperatorTranslationKey("not_equal")
                        }
                    ]
                },
                valueFilter: {
                    type: FilterType.Number,
                    operators: [
                        {
                            id: "equal",
                            name: FilterUtils.getOperatorTranslationKey("equal")
                        },
                        {
                            id: "not_equal",
                            name: FilterUtils.getOperatorTranslationKey("not_equal")
                        },
                        {
                            id: "greater",
                            name: FilterUtils.getOperatorTranslationKey("greater")
                        },
                        {
                            id: "greater_or_equal",
                            name: FilterUtils.getOperatorTranslationKey("greater_or_equal")
                        },
                        {
                            id: "less",
                            name: FilterUtils.getOperatorTranslationKey("less")
                        },
                        {
                            id: "less_or_equal",
                            name: FilterUtils.getOperatorTranslationKey("less_or_equal")
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
            filter.translateService = new DefaultTranslateAdapter();
            const config = await filter.getConfig("", {});
            expect(config).toBeDefined();
            expect(config).toStrictEqual<GroupFilterBaseConfigurationModel>({
                type: FilterType.GeoLocalization,
                rootFilter: {
                    type: FilterType.Coordinate,
                    operators: [
                        {
                            id: "equal",
                            name: FilterUtils.getOperatorTranslationKey("equal")
                        },
                        {
                            id: "not_equal",
                            name: FilterUtils.getOperatorTranslationKey("not_equal")
                        }
                    ]
                },
                valueFilter: {
                    type: FilterType.Number,
                    operators: [
                        {
                            id: "equal",
                            name: FilterUtils.getOperatorTranslationKey("equal")
                        },
                        {
                            id: "not_equal",
                            name: FilterUtils.getOperatorTranslationKey("not_equal")
                        },
                        {
                            id: "greater",
                            name: FilterUtils.getOperatorTranslationKey("greater")
                        },
                        {
                            id: "greater_or_equal",
                            name: FilterUtils.getOperatorTranslationKey("greater_or_equal")
                        },
                        {
                            id: "less",
                            name: FilterUtils.getOperatorTranslationKey("less")
                        },
                        {
                            id: "less_or_equal",
                            name: FilterUtils.getOperatorTranslationKey("less_or_equal")
                        }
                    ]
                },
                lazyLoading: false,
                group: {
                    name: FilterUtils.getGroupTranslationKey("test"),
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
            expect(options).toStrictEqual<WhereOptions>(
                where(fn("ST_Distance_Sphere", literal("test"), fn("ST_GeometryFromText", literal(`'POINT(${45.8797953} ${-73.2815516})'`), 0)), {
                    [Op.lte]: 1000
                })
            );
        });
    });
});

@Data(Coords)
class GeoLocalizationTestData {}

class GeoLocalizationTestFilter extends BaseFilter<GeoLocalizationTestData> {
    public dataDefinition = GeoLocalizationTestData;

    public distance = new GeoLocalizationFilter({
        rootFilter: new CoordinateFilter({
            attribute: "geo_point"
        })
    });

    public distanceWithCallback = new GeoLocalizationFilter({
        rootFilter: new CoordinateFilter({
            attribute: "geo_point",
            path: "location",
            where: ({ request, user }) => ({
                status: () => "active",
                user_id: () => user?.id ?? null
            })
        })
    });
}

describe("GeoLocalizationTestFilter", () => {
    let filter: FilterService<GeoLocalizationTestData>;

    beforeAll(() => {
        filter = new FilterService(
            new DefaultAccessControlAdapter(),
            new DefaultTranslateAdapter(),
            new GeoLocalizationTestFilter(),
            new SequelizeModelScanner(),
            new DataFilterService(
                new DataFilterScanner(),
                new SequelizeModelScanner(),
                new DefaultAccessControlAdapter(),
                new DefaultTranslateAdapter(),
                new DefaultExportAdapter()
            )
        );
    });

    it("getFindOptions should return a valid options config", async () => {
        const request = {};
        const user = null;

        const options = await filter.getFindOptions(Coords, {
            condition: "and",
            rules: [
                {
                    id: "distance",
                    operation: FilterOperatorTypes.Equal,
                    value: [
                        {
                            value: [45.8797953, -73.2815516],
                            operation: FilterOperatorTypes.Equal
                        },
                        {
                            value: 25000,
                            operation: FilterOperatorTypes.LessOrEqual
                        }
                    ] as [RuleModel, RuleModel]
                },
                {
                    id: "distance",
                    operation: FilterOperatorTypes.Equal,
                    value: [
                        {
                            value: [45.8797953, -73.2815516],
                            operation: FilterOperatorTypes.Equal
                        },
                        {
                            value: 5000,
                            operation: FilterOperatorTypes.LessOrEqual
                        }
                    ] as [RuleModel, RuleModel]
                }
            ]
        }, request, user);
        expect(options).toBeDefined();
        expect(options).toStrictEqual<FindOptions>({
            include: [],
            where: {
                [Op.and]: [
                    where(fn("ST_Distance_Sphere", literal("geo_point"), fn("ST_GeometryFromText", literal(`'POINT(${45.8797953} ${-73.2815516})'`), 0)), {
                        [Op.lte]: 25000
                    }),
                    where(fn("ST_Distance_Sphere", literal("geo_point"), fn("ST_GeometryFromText",  literal(`'POINT(${45.8797953} ${-73.2815516})'`), 0)), {
                        [Op.lte]: 5000
                    }),
                ]
            }
        });
    });

    it("getFindOptions should handle filter with where callback", async () => {
        const testRequest = { tenantId: 123 };
        const testUser = { id: 1, language: "en" } as any;
        
        const options = await filter.getFindOptions(Coords, {
            condition: "and",
            rules: [
                {
                    id: "distanceWithCallback",
                    operation: FilterOperatorTypes.Equal,
                    value: [
                        {
                            value: [45.8797953, -73.2815516],
                            operation: FilterOperatorTypes.Equal
                        },
                        {
                            value: 25000,
                            operation: FilterOperatorTypes.LessOrEqual
                        }
                    ] as [RuleModel, RuleModel]
                }
            ]
        }, testRequest, testUser);
        
        expect(options).toStrictEqual<FindOptions>({
            include: [
                {
                    as: "location",
                    attributes: [],
                    include: [],
                    model: Locations,
                    order: undefined,
                    paranoid: true,
                    required: false,
                    separate: false,
                    where: {
                        status: "active",
                        user_id: 1,
                    },
                },
            ],
            where: {
                [Op.and]: [
                    where(fn("ST_Distance_Sphere", literal("`location`.`geo_point`"), fn("ST_GeometryFromText", literal(`'POINT(${45.8797953} ${-73.2815516})'`), 0)), {
                        [Op.lte]: 25000
                    })
                ]
            }
        });
    });
});
