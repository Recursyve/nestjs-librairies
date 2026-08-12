import { fn, literal, ProjectionAlias } from "sequelize";
import { Fn, Literal } from "sequelize/types/utils";
import { SequelizeUtils } from "../sequelize.utils";
import { CustomAttributesConfig, CustomAttributesOptionConfig } from "./custom-attributes.model";

export interface BaseDistanceConfig extends CustomAttributesOptionConfig {
    coordinates: (option?: any) => [number, number];
    srid?: number;
}

export interface DistanceConfigWithPoint {
    attribute: string;
    /**
     * Set this when the column stores the latitude in its first coordinate, which is the order
     * the reference point used to be built with. MySQL stores the longitude first, so this only
     * exists to keep data written under the previous convention comparable until it is migrated.
     */
    legacyAxisOrder?: boolean;
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

        const location = (this.config as DistanceConfigWithPoint).legacyAxisOrder
            ? fn("ST_GeometryFromText", literal(`'POINT(${latitude} ${longitude})'`), this.config.srid ?? 0)
            : SequelizeUtils.getPoint(latitude, longitude, this.config.srid);
        return [fn("ST_Distance_Sphere", this.getPointAttribute(path), location), this.config.name ?? this.key];
    }

    public shouldGroupBy(): boolean {
        return false;
    }

    private getPointAttribute(path?: string): Literal | Fn {
        const { attribute } = this.config as DistanceConfigWithPoint;
        if (attribute) {
            return literal(SequelizeUtils.getAttributeName(attribute, path));
        }

        const { latAttribute, lngAttribute } = this.config as DistanceConfigWithLatLng;
        return SequelizeUtils.getPoint(
            SequelizeUtils.getAttributeColumn(latAttribute, path),
            SequelizeUtils.getAttributeColumn(lngAttribute, path),
            this.config.srid
        );
    }
}
