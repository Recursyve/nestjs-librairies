import type { AccessControlModel } from "../adapters/database.adapter";

export interface AccessControlResourceConfig {
    model: AccessControlModel;
    paramId?: string;
    type?: string;
}
