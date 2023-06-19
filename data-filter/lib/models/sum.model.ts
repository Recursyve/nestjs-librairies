import { fn, literal, ProjectionAlias } from "sequelize";
import { GroupOption } from "sequelize/types/model";
import { SequelizeUtils } from "../sequelize.utils";
import { CustomAttributesConfig } from "./custom-attributes.model";

export interface SumConfig {
    attribute: string;
    path?: string;
}

export class SumAttributesConfig implements CustomAttributesConfig<SumConfig> {
    public type = "sum";

    constructor(public key: string, public config: SumConfig) {}

    public transform(options: object, path?: string): string | ProjectionAlias {
        const attribute = this.config.path
            ? literal(SequelizeUtils.getLiteralFullName(this.config.attribute, this.config.path))
            : this.config.attribute;
        return [fn("SUM", attribute), this.key];
    }

    public groupBy(): GroupOption {
        const attribute = this.config.path
            ? literal(SequelizeUtils.getLiteralFullName(this.config.attribute, this.config.path))
            : this.config.attribute;

        return [attribute as string];
    }
}
