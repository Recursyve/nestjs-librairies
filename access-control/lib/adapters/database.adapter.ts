export interface IDatabaseAdapter {
    getModels(): any[];
    getResourceName(model: any): string;
    checkIfResourceExist(model: any, resourceId: number | string, condition: any): Promise<any>;
}
