export interface IDatabaseAdapter {
    getModels(): any[];
    getResourceName(model: any): string;
    checkIfResourceExist(model: any, resourceId: number, condition: any): Promise<any>;
}
