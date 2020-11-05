import { IncludeConfig } from "../../../data-filter/lib";

export interface AttributesConfigModel {
    key: string;
    path?: string;
}

export class AttributesConfig implements AttributesConfigModel {
    public path?: string;
    public includes: IncludeConfig[] = [];
    public ignoreInSearch = false;

    constructor(public key: string) {
        this.path = key;
    }

    public setIgnoreInPath(ignore: boolean) {
        this.ignoreInSearch = ignore;
    }

    public addInclude(include: IncludeConfig) {
        this.includes.push(include);
    }
}
