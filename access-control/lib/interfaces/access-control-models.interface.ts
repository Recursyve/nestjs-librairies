import type { AccessControlModel } from "../adapters/database.adapter";

export interface AccessControlModelsFactory {
    getModels(): AccessControlModel[] | Promise<AccessControlModel[]>;
}
