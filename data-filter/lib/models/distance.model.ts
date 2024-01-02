import { fn, literal, ProjectionAlias } from "sequelize";
import { DialectFormatterService } from "../services/dialect-formatter.service";
import {
    CustomAttributesConfig,
    CustomAttributesContext,
    CustomAttributesOptionConfig
} from "./custom-attributes.model";

export interface BaseDistanceConfig extends CustomAttributesOptionConfig {
    coordinates: (option?) => [number, number];
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

export class DistanceAttributesConfig implements CustomAttributesConfig<DistanceConfig, DistanceAttributesContext> {
    public type = "distance";

    constructor(public key: string, public config: DistanceConfig) {}

    public withContext(dialectFormatterService: DialectFormatterService): DistanceAttributesContext {
        return new DistanceAttributesContext(this, dialectFormatterService);
    }

    public shouldGroupBy(): boolean {
        return false;
    }
}

export class DistanceAttributesContext extends CustomAttributesContext {
    constructor(private config: DistanceAttributesConfig, private dialectFormatterService: DialectFormatterService) {
        super();
    }

    public transform(options: object, path?: string): string | ProjectionAlias {
        if (!options) {
            return null;
        }

        const coordinates = this.config.config.coordinates(options);
        if (!coordinates || coordinates.length < 2) {
            return null;
        }

        const [latitude, longitude] = coordinates;
        if (typeof latitude !== "number" || typeof longitude !== "number") {
            return null;
        }
        if (path || this.config.config.path) {
            path = [path, this.config.config.path].filter(x => x).join(".");
        }

        const location = fn("ST_GeometryFromText", literal(`'POINT(${latitude} ${longitude})'`), this.config.config.srid ?? 0);
        return [fn("ST_Distance_Sphere", this.getPointAttribute(path), location), this.config.config.name ?? this.config.key];
    }

    private getPointAttribute(path: string) {
        if ((this.config.config as DistanceConfigWithPoint).attribute) {
            const att = (this.config.config as DistanceConfigWithPoint).attribute;
            return literal(path ? this.dialectFormatterService.getLiteralFullName(att, path) : att);
        }

        const lat = path ? literal(this.dialectFormatterService.getLiteralFullName((this.config.config as DistanceConfigWithLatLng).latAttribute, path)) : (this.config.config as DistanceConfigWithLatLng).latAttribute;
        const lng = path ? literal(this.dialectFormatterService.getLiteralFullName((this.config.config as DistanceConfigWithLatLng).lngAttribute, path)) : (this.config.config as DistanceConfigWithLatLng).lngAttribute;
        const point = fn("Point", lng, lat);
        return this.config.config.srid ? fn("ST_SRID", point, this.config.config.srid) : point;
    }
}