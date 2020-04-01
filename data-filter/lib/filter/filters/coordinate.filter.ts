import { FilterType } from "../type";
import { FilterOperatorTypes, SelectOperators } from "../operators";
import { BaseFilterDefinition, Filter } from "./filter";
import { QueryRuleModel, RuleModel } from "../models";
import { Op, WhereOptions } from "sequelize";
import { SequelizeUtils } from "../../sequelize.utils";

export class CoordinateFilter extends Filter {
    public type = FilterType.Coordinate;
    public operators = [...SelectOperators];

    constructor(definition: BaseFilterDefinition) {
        super(definition);
    }

    public async getWhereOptions(rule: QueryRuleModel): Promise<WhereOptions> {
        const [latitude, longitude] = CoordinateFilter.getCoordinates(rule);
        switch (rule.operation) {
            case FilterOperatorTypes.Equal:
                return this.getEqualWhereOptions(rule, latitude, longitude);
            case FilterOperatorTypes.NotEqual:
                return this.getNotEqualWhereOptions(rule, latitude, longitude);
        }
    }

    private async getEqualWhereOptions(rule: QueryRuleModel, latitude: number, longitude: number): Promise<WhereOptions> {
        return {
            [Op.and]: [
                await super.getWhereOptions({
                    operation: FilterOperatorTypes.Equal,
                    value: latitude,
                    id: rule.id
                }, SequelizeUtils.getAttributeFullName("latitude", [this.path, this.attribute].filter(x => x).join("."))),
                await super.getWhereOptions({
                    operation: FilterOperatorTypes.Equal,
                    value: longitude,
                    id: rule.id
                }, SequelizeUtils.getAttributeFullName("longitude", [this.path, this.attribute].filter(x => x).join("."))),
            ]
        };
    }

    private async getNotEqualWhereOptions(rule: QueryRuleModel, latitude: number, longitude: number): Promise<WhereOptions> {
        return {
            [Op.or]: [
                await super.getWhereOptions({
                    operation: FilterOperatorTypes.NotEqual,
                    value: latitude,
                    id: rule.id
                }, SequelizeUtils.getAttributeFullName("latitude", [this.path, this.attribute].filter(x => x).join("."))),
                await super.getWhereOptions({
                    operation: FilterOperatorTypes.NotEqual,
                    value: longitude,
                    id: rule.id
                }, SequelizeUtils.getAttributeFullName("longitude", [this.path, this.attribute].filter(x => x).join("."))),
            ]
        };
    }

    public static getCoordinates(rule: RuleModel): [number, number] {
        const [latitude, longitude] = rule.value as [number, number];
        if (typeof latitude !== "number" && typeof longitude !== "number") {
            return [0, 0];
        }

        return [latitude, longitude];
    }
}
