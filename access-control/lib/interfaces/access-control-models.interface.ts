export interface AccessControlModelsFactory {
    getModels(): Promise<any[]> | any[];
}
