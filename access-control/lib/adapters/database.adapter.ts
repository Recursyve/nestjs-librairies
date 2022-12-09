import { ResourceId } from "../models";

export interface IDatabaseAdapter {
    getModels(): any[];
    getResourceName(model: any): string;
    parseIds(model: any, ids: string | string[]): ResourceId | ResourceId[];
    checkIfResourceExist(model: any, resourceId: ResourceId, condition: any): Promise<any>;
}
