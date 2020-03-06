import { CoordinateFilter } from "./coordinate.filter";
import { FilterOperatorTypes } from "../operators";
import { Op, WhereOptions } from "sequelize";
import { FilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { FilterType } from "../type";

describe("CoordinateFilter", () => {
    describe("getConfig", () => {
        it("should return a valid config", async () => {
            const filter = new CoordinateFilter({
                attribute: "test"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
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
            });
        });

        it("with group should return a valid config", async () => {
            const filter = new CoordinateFilter({
                attribute: "test",
                group: "test"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
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
                ],
                group: {
                    name: "test",
                    key: "test"
                }
            });
        });

        it("with custom operator should return a valid config", async () => {
            const filter = new CoordinateFilter({
                attribute: "test"
            }).addOperators({
                name: "none"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Coordinate,
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
                        id: "none",
                        name: "none"
                    }
                ]
            });
        });

        it("with specified operators should return a valid config", async () => {
            const filter = new CoordinateFilter({
                attribute: "test"
            }).setOperators(FilterOperatorTypes.Equal);
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Coordinate,
                operators: [
                    {
                        id: "equal",
                        name: "equal"
                    }
                ]
            });
        });
    });

    describe("getWhereOptions", () => {
        it("with equal operator should return a valid filter config", async () => {
            const filter = new CoordinateFilter({
                attribute: "test"
            });
            const options = await filter.getWhereOptions({
                id: "test",
                value: [45.8797953, -73.2815516],
                operation: FilterOperatorTypes.Equal
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                [Op.and]: [
                    {
                        "$test.latitude$": 45.8797953
                    },
                    {
                        "$test.longitude$": -73.2815516
                    }
                ]
            });
        });

        it("with not equal operator custom name should return a valid filter config", async () => {
            const filter = new CoordinateFilter({
                attribute: "test"
            });
            const options = await filter.getWhereOptions({
                id: "test",
                value: [45.8797953, -73.2815516],
                operation: FilterOperatorTypes.NotEqual
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                [Op.or]: [
                    {
                        "$test.latitude$": {
                            [Op.ne]: 45.8797953
                        }
                    },
                    {
                        "$test.longitude$": {
                            [Op.ne]: -73.2815516
                        }
                    }
                ]
            });
        });
    });
});
