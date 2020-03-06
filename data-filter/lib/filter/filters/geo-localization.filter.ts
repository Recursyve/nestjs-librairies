import { FindAttributeOptions, fn, literal, WhereOptions } from "sequelize";
import { QueryRuleModel } from "../models";
import { SequelizeUtils } from "../../sequelize.utils";
import { GroupFilter, GroupFilterDefinition } from "./group.filter";
import { CoordinateFilter } from "./coordinate.filter";
import { NumberFilter } from "./number.filter";
import { FilterType } from "../type";

export interface GeoLocalizationFilterDefinition {
    rootFilter: CoordinateFilter;
    group?: string;
}

export class GeoLocalizationFilter extends GroupFilter implements GroupFilterDefinition, GeoLocalizationFilterDefinition {
    private static attributesCounter = 0;
    private static whereCounter = 0;

    public type = FilterType.GeoLocalization;
    public rootFilter: CoordinateFilter;
    public valueFilter = new NumberFilter();

    constructor(definition: GeoLocalizationFilterDefinition) {
        super(definition);
    }

    public async getAttributeOptions(rule: QueryRuleModel): Promise<FindAttributeOptions> {
        const [root] = this.getRules(rule);
        const name = this.rootFilter.path ?
            SequelizeUtils.getLiteralFullName(this.rootFilter.attribute, this.rootFilter.path) :
            this.rootFilter.attribute;
        const [latitude, longitude] = CoordinateFilter.getCoordinates(root);
        const location = literal(`point(${latitude}, ${longitude})`);
        return [[
            fn("ST_Distance_Sphere", literal(name), location),
            `${rule.id}_distance_${GeoLocalizationFilter.attributesCounter++}`
        ]];
    }

    public async getWhereOptions(rule: QueryRuleModel): Promise<WhereOptions> {
        const [, value] = this.getRules(rule);
        return {
            [`${rule.id}_distance_${GeoLocalizationFilter.whereCounter++}`]: SequelizeUtils.generateWhereValue(value)
        };
    }

    public static reset(): void {
        this.attributesCounter = 0;
        this.whereCounter = 0;
    }
}
