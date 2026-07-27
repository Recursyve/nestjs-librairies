import { Injectable } from "@nestjs/common";
import { AccessControlAdapter, AccessControlResources } from "@recursyve/nestjs-data-filter";
import { TestAccessControlUser } from "./test-access-control-user.model";

@Injectable()
export class TestAccessControlAdapter extends AccessControlAdapter {
    public async getResources<Users extends TestAccessControlUser>(
        _model: unknown,
        user: Users
    ): Promise<AccessControlResources> {
        if (user.scopeUserId) {
            return Promise.resolve(AccessControlResources.fromCondition({ user_id: user.scopeUserId }));
        }

        if (user.allowedPersonIds) {
            return Promise.resolve(AccessControlResources.fromIds(user.allowedPersonIds));
        }

        return Promise.resolve(AccessControlResources.fromIds([]));
    }
}
