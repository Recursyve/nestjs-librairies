import type { Model } from "sequelize";
import type { HookReturn } from "sequelize/types/hooks";

import { SequelizeUtils } from "../utils/sequelize.utils";

export function AfterFindFormatDateOnlyHook<M extends Model>(instances: M | M[]): HookReturn {
    if (Array.isArray(instances)) {
        instances.forEach(SequelizeUtils.formatInstanceDateOnly);
    } else {
        SequelizeUtils.formatInstanceDateOnly(instances);
    }
}
