import type { Model } from "sequelize";
import type { HookReturn } from "sequelize/types/hooks";

import { SequelizeUtils } from "../utils/sequelize.utils";

export function AfterBulkCreateFormatDateOnlyHook(instances: Model[]): HookReturn {
    for (const instance of instances) {
        void AfterCreateFormatDateOnlyHook(instance);
    }
}

export function AfterCreateFormatDateOnlyHook(instance: Model): HookReturn {
    SequelizeUtils.formatInstanceDateOnly(instance);
}
