import { fn, literal, where, WhereOptions } from "sequelize";
import { Fn, Literal } from "sequelize/types/utils";
import { SequelizeUtils } from "../../sequelize.utils";
import { QueryRuleModel } from "../models";
import { FilterOperatorTypes, SelectOperators } from "../operators";
import { FilterType } from "../type";
import { BaseFilterDefinition, Filter } from "./filter";

export interface GeoBoundsFilterDefinitionWithPoint {
    attribute: string;
}

export interface GeoBoundsFilterDefinitionWithLatLng {
    latAttribute: string;
    lngAttribute: string;
}

export interface BaseGeoBoundsFilterDefinition  extends Omit<BaseFilterDefinition, "attribute"> {
    srid?: number;
    /**
     * Set this when the incoming bounds are already expressed in the order the polygon used to
     * be written with, where the latitude always came first. Kept as a migration escape hatch
     * for callers that mirrored their coordinates to compensate for that order.
     */
    legacyAxisOrder?: boolean;
}

export type GeoBoundsFilterDefinition = BaseGeoBoundsFilterDefinition & (GeoBoundsFilterDefinitionWithPoint | GeoBoundsFilterDefinitionWithLatLng);

export class GeoBoundsFilter extends Filter implements BaseGeoBoundsFilterDefinition, GeoBoundsFilterDefinitionWithPoint, GeoBoundsFilterDefinitionWithLatLng  {
    public type = FilterType.GeoBounds;
    public operators = [...SelectOperators];
    public latAttribute!: string;
    public lngAttribute!: string;
    public srid?: number;
    public legacyAxisOrder?: boolean;

    constructor(definition: GeoBoundsFilterDefinition) {
        super(definition as BaseFilterDefinition);
    }

    public async getWhereOptions(rule: QueryRuleModel): Promise<WhereOptions> {
        const points = rule.value as [number, number][];
        points.push(points[0]);
        const polygon = fn("ST_GeometryFromText", literal(`'POLYGON((${this.formatPoints(points)}))'`), this.srid ?? 0);
        return where(
            fn("ST_Contains", polygon, this.buildPoint()),
            literal(`${rule.operation === FilterOperatorTypes.Equal ? 1 : 0}`)
        );
    }

    /**
     * The polygon is the one geometry the library still imports from WKT, and WKT is read
     * with the axis order of the target SRS: a geographic SRID expects the latitude first,
     * while SRID 0 has no SRS and is read in the longitude-first storage order the compared
     * point uses. The legacy order is the SRID one applied unconditionally.
     */
    private formatPoints(points: [number, number][]): string {
        return points
            .map(([latitude, longitude]) =>
                (this.srid || this.legacyAxisOrder) ? `${latitude} ${longitude}` : `${longitude} ${latitude}`
            )
            .join(", ");
    }

    private buildPoint(): Literal | Fn {
        if (!this.attribute) {
            return SequelizeUtils.getPoint(
                SequelizeUtils.getAttributeColumn(this.latAttribute, this.path),
                SequelizeUtils.getAttributeColumn(this.lngAttribute, this.path),
                this.srid
            );
        }

        const attribute = literal(SequelizeUtils.getAttributeName(this.attribute, this.path));
        return this.srid ? fn("ST_SRID", attribute, this.srid) : attribute;
    }
}
