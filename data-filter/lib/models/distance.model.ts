import { CustomAttributesConfig } from "./custom-attributes.model";
import { fn, literal, ProjectionAlias } from "sequelize";
import { SequelizeUtils } from "../sequelize.utils";

export interface DistanceConfig {
    attribute: string;
    coordinates: (option?) => [number, number];
    name: string;
    path?: string;
}

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

        const name = path ? SequelizeUtils.getLiteralFullName(this.config.attribute, path) : this.config.attribute;
        const location = literal(`point(${latitude}, ${longitude})`);
        return [fn("ST_Distance_Sphere", literal(name), location), this.config.name ?? this.key];
    }
}
