import { DateFilter } from "./date.filter";
import { FilterOperatorTypes } from "../operators";
import { Op, WhereOptions } from "sequelize";
import { FilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { FilterType } from "../type";

describe("DateFilter", () => {
    describe("getConfig", () => {
        it("should return a valid config", async () => {
            const filter = new DateFilter({
                attribute: "test"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Date,
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
                    },
                    {
                        "id": "between",
                        "name": "between"
                    },
                    {
                        "id": "not_between",
                        "name": "not_between"
                    }
                ]
            });
        });

        it("with group should return a valid config", async () => {
            const filter = new DateFilter({
                attribute: "test",
                group: "test"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Date,
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
                    },
                    {
                        "id": "between",
                        "name": "between"
                    },
                    {
                        "id": "not_between",
                        "name": "not_between"
                    }
                ],
                group: {
                    name: "test",
                    key: "test"
                }
            });
        });

        it("with custom operator should return a valid config", async () => {
            const filter = new DateFilter({
                attribute: "test"
            }).addOperators({
                name: "none"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Date,
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
                    },
                    {
                        "id": "between",
                        "name": "between"
                    },
                    {
                        "id": "not_between",
                        "name": "not_between"
                    },
                    {
                        id: "none",
                        name: "none"
                    }
                ]
            });
        });

        it("with specified operators should return a valid config", async () => {
            const filter = new DateFilter({
                attribute: "test"
            }).setOperators(FilterOperatorTypes.Equal, FilterOperatorTypes.NotEqual);
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Date,
                operators: [
                    {
                        id: "equal",
                        name: "equal"
                    },
                    {
                        id: "not_equal",
                        name: "not_equal"
                    }
                ]
            });
        });
    });

    describe("getWhereOptions", () => {
        it("with equal operator should return a valid filter config", async () => {
            const filter = new DateFilter({
                attribute: "test"
            });
            const options = await filter.getWhereOptions({
                id: "test",
                value: "2020-03-06T00:55:12",
                operation: FilterOperatorTypes.Equal
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                test: {
                    [Op.between]: [
                        "2020-03-06T00:00:00-05:00",
                        "2020-03-06T23:59:59-05:00"
                    ]
                }
            });
        });

        it("with not equal operator custom name should return a valid filter config", async () => {
            const filter = new DateFilter({
                attribute: "test"
            });
            const options = await filter.getWhereOptions({
                id: "test",
                value: "2020-03-06T00:55:12",
                operation: FilterOperatorTypes.NotEqual
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                [Op.or]: [
                    {
                        test: {
                            [Op.lt]: "2020-03-06T00:00:00-05:00"
                        }
                    },
                    {
                        test: {
                            [Op.gt]: "2020-03-06T23:59:59-05:00"
                        }
                    }
                ]
            });
        });

        it("with less operator should return a valid filter config", async () => {
            const filter = new DateFilter({
                attribute: "test"
            });
            const options = await filter.getWhereOptions({
                id: "test",
                value: "2020-03-06T00:55:12",
                operation: FilterOperatorTypes.Less
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                test: {
                    [Op.lt]: "2020-03-06T00:00:00-05:00"
                }
            });
        });

        it("with less or equal operator should return a valid filter config", async () => {
            const filter = new DateFilter({
                attribute: "test"
            });
            const options = await filter.getWhereOptions({
                id: "test",
                value: "2020-03-06T00:55:12",
                operation: FilterOperatorTypes.LessOrEqual
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                test: {
                    [Op.lte]: "2020-03-06T23:59:59-05:00"
                }
            });
        });

        it("with greater operator should return null", async () => {
            const filter = new DateFilter({
                attribute: "test"
            });
            const options = await filter.getWhereOptions({
                id: "test",
                value: "2020-03-06T00:55:12",
                operation: FilterOperatorTypes.Greater
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                test: {
                    [Op.gt]: "2020-03-06T23:59:59-05:00"
                }
            });
        });

        it("with greater or equal operator should return a valid filter config", async () => {
            const filter = new DateFilter({
                attribute: "test"
            });
            const options = await filter.getWhereOptions({
                id: "test",
                value: "2020-03-06T00:55:12",
                operation: FilterOperatorTypes.GreaterOrEqual
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                test: {
                    [Op.gte]: "2020-03-06T00:00:00-05:00"
                }
            });
        });

        it("with between operator should return a valid filter config", async () => {
            const filter = new DateFilter({
                attribute: "test"
            });
            const options = await filter.getWhereOptions({
                id: "test",
                value: ["2020-03-06T00:55:12", "2020-06-06T00:55:12"],
                operation: FilterOperatorTypes.Between
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                test: {
                    [Op.between]: [
                        "2020-03-06T00:00:00-05:00",
                        "2020-06-06T23:59:59-05:00"
                    ]
                }
            });
        });

        it("with not between operator should return a valid filter config", async () => {
            const filter = new DateFilter({
                attribute: "test"
            });
            const options = await filter.getWhereOptions({
                id: "test",
                value: ["2020-03-06T00:55:12", "2020-06-06T00:55:12"],
                operation: FilterOperatorTypes.NotBetween
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                test: {
                    [Op.notBetween]: [
                        "2020-03-06T00:00:00-05:00",
                        "2020-06-06T23:59:59-05:00"
                    ]
                }
            });
        });
    });
});
