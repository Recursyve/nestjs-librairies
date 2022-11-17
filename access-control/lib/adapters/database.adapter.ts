import { ResourceId } from "../models";

export interface IDatabaseAdapter {
    getModels(): any[];
    getResourceName(model: any): string;
    checkIfResourceExist(model: any, resourceId: ResourceId, condition: any): Promise<any>;
}
