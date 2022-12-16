export interface IConfigProvider {
    getValue(key: string): Promise<string>;
}
