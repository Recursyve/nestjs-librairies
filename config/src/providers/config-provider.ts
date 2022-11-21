export interface ConfigProvider {
    getValue(key: string): Promise<string>;
}
