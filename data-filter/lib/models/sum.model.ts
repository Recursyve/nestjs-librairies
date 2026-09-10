import { fn, literal, ProjectionAlias } from "sequelize";
import { SequelizeUtils } from "../sequelize.utils";
import { CustomAttributesConfig, CustomAttributesOptionConfig } from "./custom-attributes.model";

export interface SumConfig extends CustomAttributesOptionConfig {
    attribute: string;
}

export class SumAttributesConfig implements CustomAttributesConfig<SumConfig> {
    public type = "sum";

    constructor(public key: string, public config: SumConfig) {}

    public transform(options: object, path?: string): string | ProjectionAlias {
        const fullPath = [path, this.config.path].filter(x => x).join(".");
        const attribute = fullPath
            ? literal(SequelizeUtils.getLiteralFullName(this.config.attribute, fullPath))
            : this.config.attribute;
        return [fn("SUM", attribute), this.key];
    }

    public shouldGroupBy(): boolean {
        return true;
    }
}
