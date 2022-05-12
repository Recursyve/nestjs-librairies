import { fn, literal, ProjectionAlias } from "sequelize";
import { SequelizeUtils } from "../sequelize.utils";
import { CustomAttributesConfig } from "./custom-attributes.model";

export interface BaseDistanceConfig {
    coordinates: (option?) => [number, number];
    name: string;
    path?: string;
    srid?: number;
}

export interface DistanceConfigWithPoint {
    attribute: string;
}

export interface DistanceConfigWithLatLng {
    latAttribute: string;
    lngAttribute: string;
}

export type DistanceConfig = BaseDistanceConfig & (DistanceConfigWithPoint | DistanceConfigWithLatLng);

export class DistanceAttributesConfig implements CustomAttributesConfig<DistanceConfig> {
    public type = "distance";

    constructor(public key: string, public config: DistanceConfig) {}

    public transform(options: object, path?: string): string | ProjectionAlias {
        if (!options) {
            return null;
        }

        const coordinates = this.config.coordinates(options);
        if (!coordinates || coordinates.length < 2) {
            return null;
        }

        const [latitude, longitude] = coordinates;
        if (typeof latitude !== "number" || typeof longitude !== "number") {
            return null;
        }
        if (path || this.config.path) {
            path = [path, this.config.path].filter(x => x).join(".");
        }

        const location = fn("ST_GeometryFromText", literal(`'POINT(${latitude} ${longitude})'`), this.config.srid ?? 0);
        return [fn("ST_Distance_Sphere", this.getPointAttribute(path), location), this.config.name ?? this.key];
    }

    private getPointAttribute(path: string) {
        if ((this.config as DistanceConfigWithPoint).attribute) {
            const att = (this.config as DistanceConfigWithPoint).attribute;
            return literal(path ? SequelizeUtils.getLiteralFullName(att, path) : att);
        }

        const lat = path ? SequelizeUtils.getLiteralFullName((this.config as DistanceConfigWithLatLng).latAttribute, path) : (this.config as DistanceConfigWithLatLng).latAttribute;
        const lng = path ? SequelizeUtils.getLiteralFullName((this.config as DistanceConfigWithLatLng).lngAttribute, path) : (this.config as DistanceConfigWithLatLng).lngAttribute;
        const point = fn("Point", lng, lat);
        return this.config.srid ? fn("ST_SRID", point, this.config.srid) : point;
    }
}
