import { CreateOptions, Model } from "sequelize";
import { HookReturn } from "sequelize/types/hooks";
import { SequelizeUtils } from "../utils/sequelize.utils";

export function AfterCreateFormatDateOnlyHook<M extends Model>(instance: M, options: CreateOptions): HookReturn {
    if (!instance) {
        return;
    }

    SequelizeUtils.formatInstanceDateOnly(instance);
}
