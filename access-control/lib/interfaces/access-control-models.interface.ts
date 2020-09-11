import { M } from "../utils";

export interface AccessControlModelsFactory {
    getModels(): Promise<(typeof M)[]> | (typeof M)[];
}
