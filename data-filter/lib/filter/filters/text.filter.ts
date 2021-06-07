import { DataFilterUserModel, FilterBaseConfigurationModel } from "../..";
import { FilterType } from "../type";
import { StringOperators } from "../operators";
import { BaseFilterDefinition, Filter } from "./filter";

export interface TextFilterDefinition {
    mask?: string;
}

export class TextFilter extends Filter {
    public type = FilterType.Text;
    public operators = [...StringOperators];
    public mask?: string;

    constructor(definition: TextFilterDefinition & BaseFilterDefinition) {
        super(definition);
    }

    public async getConfig(key: string, user?: DataFilterUserModel): Promise<FilterBaseConfigurationModel> {
        if (this.private) {
            return;
        }

        if (!this.mask) {
            return super.getConfig(key, user);
        }

        const config = await super.getConfig(key, user);
        return {
            ...config,
           mask: this.mask
        };
    }
}
