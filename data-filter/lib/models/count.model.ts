import { fn, literal, ProjectionAlias } from "sequelize";
import { SequelizeUtils } from "../sequelize.utils";
import { CustomAttributesConfig, CustomAttributesOptionConfig } from "./custom-attributes.model";

export interface CountConfig extends CustomAttributesOptionConfig {
    attribute: string;
    distinct?: boolean;
}

export class CountAttributesConfig implements CustomAttributesConfig<CountConfig> {
    public type = "count";

    constructor(public key: string, public config: CountConfig) {}

    public transform(options: object, path?: string): string | ProjectionAlias {
        const fullPath = [path, this.config.path].filter(x => x).join(".");
        if (this.config.distinct) {
            const attribute = fullPath
                ? SequelizeUtils.getLiteralFullName(this.config.attribute, fullPath)
                : this.config.attribute;
            return [literal(`COUNT(DISTINCT ${attribute})`), this.key];
        }

        const attribute = fullPath
            ? literal(SequelizeUtils.getLiteralFullName(this.config.attribute, fullPath))
            : this.config.attribute;
        return [fn("COUNT", attribute), this.key];
    }

    public shouldGroupBy(): boolean {
        return true;
    }
}
