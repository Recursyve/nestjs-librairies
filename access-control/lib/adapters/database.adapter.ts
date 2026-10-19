import type { ResourceId } from "../models/resources.model";

/**
 * ORM-specific model token (entity class, Mongoose model, etc.) used by access-control.
 */
export type AccessControlModel = object;

/** Additional predicates merged into existence checks for condition-based access. */
export type AccessControlWhereCondition = Record<string, unknown>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IDatabaseAdapter {
    getModels(): AccessControlModel[];
    getResourceName(model: AccessControlModel): string;
    parseIds(model: AccessControlModel, ids: string[] | string): ResourceId | ResourceId[];
    checkIfResourceExist(
        model: AccessControlModel,
        resourceId: ResourceId,
        condition: AccessControlWhereCondition
    ): Promise<boolean>;
}
