import { col, fn, literal, ProjectionAlias } from "sequelize";
import { Col, Fn, Literal } from "sequelize/types/utils";
import { SequelizeUtils } from "../sequelize.utils";
import { CustomAttributesConfig, CustomAttributesOptionConfig } from "./custom-attributes.model";

export interface BaseDistanceConfig extends CustomAttributesOptionConfig {
    coordinates: (option?: any) => [number, number];
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
    public readonly key: string;
    public type = "distance";

    constructor(key: string | symbol, public config: DistanceConfig) {
        this.key = typeof key === "string" ? key : key.toString();
    }

    public transform(options: object, path?: string): string | ProjectionAlias | null {
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

    public shouldGroupBy(): boolean {
        return false;
    }

    private getPointAttribute(path?: string): Literal | Fn {
        if ((this.config as DistanceConfigWithPoint).attribute) {
            const att = (this.config as DistanceConfigWithPoint).attribute;
            return literal(path ? SequelizeUtils.getLiteralFullName(att, path) : att);
        }

        const lat = path ? literal(SequelizeUtils.getLiteralFullName((this.config as DistanceConfigWithLatLng).latAttribute, path)) : col((this.config as DistanceConfigWithLatLng).latAttribute);
        const lng = path ? literal(SequelizeUtils.getLiteralFullName((this.config as DistanceConfigWithLatLng).lngAttribute, path)) : col((this.config as DistanceConfigWithLatLng).lngAttribute);
        return this.buildPoint(lat, lng);
    }

    /**
     * MySQL stores the longitude in the first coordinate and applies the SRS axis order
     * only when importing or exporting geometries. Point() writes that storage order
     * directly, while the reference point goes through ST_GeometryFromText: a geographic
     * SRID swaps its lat/lng pair into storage order, whereas SRID 0 has no SRS and writes
     * the pair verbatim, leaving the latitude in the longitude. The projection follows the
     * same convention so both points stay comparable.
     */
    private buildPoint(lat: Literal | Col, lng: Literal | Col): Fn {
        const srid = this.config.srid;
        if (!srid) {
            return fn("Point", lat, lng);
        }

        return fn("ST_SRID", fn("Point", lng, lat), srid);
    }
}
