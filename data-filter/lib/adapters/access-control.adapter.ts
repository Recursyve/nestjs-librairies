import { M } from "../sequelize.utils";

export abstract class AccessControlAdapter {
    public abstract getResourceIds<Users>(model: typeof M, user: Users): Promise<number[]>;
}
