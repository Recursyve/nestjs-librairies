import { FindOptions, Model } from "sequelize";
import { HookReturn } from "sequelize/types/hooks";
import { SequelizeUtils } from "../utils/sequelize.utils";

export function AfterFindFormatDateOnlyHook<M extends Model>(instances: M[] | M, options: FindOptions): HookReturn {
    if (!instances) {
        return;
    }

    if (Array.isArray(instances)) {
        instances.forEach(SequelizeUtils.formatInstanceDateOnly);
    } else {
        SequelizeUtils.formatInstanceDateOnly(instances);
    }
}
