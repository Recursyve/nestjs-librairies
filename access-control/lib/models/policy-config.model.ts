import type { AccessControlModel } from "../adapters/database.adapter";

export interface PolicyConfig {
    model: AccessControlModel;
    type?: string;
}
