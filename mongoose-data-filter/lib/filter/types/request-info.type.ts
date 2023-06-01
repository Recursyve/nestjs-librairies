import { DataFilterUserModel } from "../../models/user.model";

export type RequestInfo<Request = any> = {
    user?: DataFilterUserModel;
    request: Request;
};
