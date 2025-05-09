import { DefaultTranslateAdapter } from "../../adapters/default-translate.adapter";
import { FilterUtils } from "../filter.utils";
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
            filter.translateService = new DefaultTranslateAdapter();
            const config = await filter.getConfig("", null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Date,
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
                    },
                    {
                        id: "between",
                        name: FilterUtils.getOperatorTranslationKey("between")
                    },
                    {
                        id: "not_between",
                        name: FilterUtils.getOperatorTranslationKey("not_between")
                    }
                ]
            });
        });

        it("with group should return a valid config", async () => {
            const filter = new DateFilter({
                attribute: "test",
                group: "test"
            });
            filter.translateService = new DefaultTranslateAdapter();
            const config = await filter.getConfig("", null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Date,
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
                    },
                    {
                        id: "between",
                        name: FilterUtils.getOperatorTranslationKey("between")
                    },
                    {
                        id: "not_between",
                        name: FilterUtils.getOperatorTranslationKey("not_between")
                    }
                ],
                group: {
                    name: FilterUtils.getGroupTranslationKey("test"),
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
            filter.translateService = new DefaultTranslateAdapter();
            const config = await filter.getConfig("test", null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Date,
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
                    },
                    {
                        id: "between",
                        name: FilterUtils.getOperatorTranslationKey("between")
                    },
                    {
                        id: "not_between",
                        name: FilterUtils.getOperatorTranslationKey("not_between")
                    },
                    {
                        id: "none",
                        name: FilterUtils.getCustomOperatorTranslationKey("test", "none")
                    }
                ]
            });
        });

        it("with specified operators should return a valid config", async () => {
            const filter = new DateFilter({
                attribute: "test"
            }).setOperators(FilterOperatorTypes.Equal, FilterOperatorTypes.NotEqual);
            filter.translateService = new DefaultTranslateAdapter();
            const config = await filter.getConfig("", null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Date,
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
                        "2020-03-05T00:00:00.000Z",
                        "2020-03-05T23:59:59.999Z"
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
                            [Op.lt]: "2020-03-05T00:00:00.000Z"
                        }
                    },
                    {
                        test: {
                            [Op.gt]: "2020-03-05T23:59:59.999Z"
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
                    [Op.lt]: "2020-03-05T00:00:00.000Z"
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
                    [Op.lte]: "2020-03-05T23:59:59.999Z"
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
                    [Op.gt]: "2020-03-05T23:59:59.999Z"
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
                    [Op.gte]: "2020-03-05T00:00:00.000Z"
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
                        "2020-03-05T00:00:00.000Z",
                        "2020-06-05T22:59:59.999Z"
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
                        "2020-03-05T00:00:00.000Z",
                        "2020-06-05T22:59:59.999Z"
                    ]
                }
            });
        });
    });
});
