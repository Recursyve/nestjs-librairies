import { Where } from "sequelize/types/utils";
import { M } from "../sequelize.utils";

export class AccessControlResources {
    public all?: boolean;
    public ids?: number[];
    public where?: Where;

    private constructor({ all, ids, where }: { all?: boolean; ids?: number[]; where?: Where }) {
        this.all = all;
        this.ids = ids;
        this.where = where;
    }

    public static all(): AccessControlResources {
        return new AccessControlResources({ all: true });
    }

    public static fromIds(ids: number[]): AccessControlResources {
        return new AccessControlResources({ ids });
    }

    public static fromCondition(where: Where): AccessControlResources {
        return new AccessControlResources({ where });
    }
}

export abstract class AccessControlAdapter {
    public abstract getResources<Users>(model: typeof M, user: Users): Promise<AccessControlResources>;
}
