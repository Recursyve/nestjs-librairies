export interface TransformationsConfigModel {
    key: string;
    transformer: (value: any, document: any) => any;
}

export class TransformationsConfig implements TransformationsConfigModel {
    constructor(public key: string, public transformer: (value: any, document: any) => any) {}

    public transform(value: any, document: any): any {
        return this.transformer(value, document);
    }
}
