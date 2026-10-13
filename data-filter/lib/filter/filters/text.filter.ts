import type { DataFilterUserModel } from "../../models/user.model";
import { FilterBaseConfigurationModel } from "../..";
import { FilterType } from "../type";
import { FilterOperatorTypes, StringOperators } from "../operators";
import type { BaseFilterDefinition } from "./filter";
import { Filter } from "./filter";

export interface TextFilterDefinition {
    mask?: string;
}

export class TextFilter extends Filter {
    public override type: FilterType = FilterType.Text;
    public override operators: FilterOperatorTypes[] = [...StringOperators];
    public mask?: string;

    constructor(definition: TextFilterDefinition & BaseFilterDefinition) {
        super(definition);
    }

    public override async getConfig<Request>(key: string, request: Request, user?: DataFilterUserModel): Promise<FilterBaseConfigurationModel | null> {
        if (!this.mask) {
            return super.getConfig(key, request, user);
        }

        const config = await super.getConfig(key, request, user);

        if (!config) {
            return null;
        }

        return {
            ...config,
           mask: this.mask
        };
    }
}
