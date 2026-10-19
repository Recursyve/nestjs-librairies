import type { AccessControlModel } from "../adapters/database.adapter";
import type { ResourceId } from "../models/resources.model";

export interface AccessControlHttpRequest {
    route: { path: string };
    params: Record<string, ResourceId | string>;
    resources?: AccessControlModel[];
}
