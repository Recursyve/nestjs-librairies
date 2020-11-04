export interface AttributesConfigModel {
    key: string;
    path?: string;
}

export class AttributesConfig implements AttributesConfigModel {
    public path?: string;

    constructor(public key: string) {
        this.path = key;
    }
}
