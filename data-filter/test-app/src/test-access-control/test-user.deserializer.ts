import { Injectable } from "@nestjs/common";
import { UserDeserializer } from "@recursyve/nestjs-data-filter";
import { TestAccessControlUser } from "./test-access-control-user.model";

@Injectable()
export class TestUserDeserializer extends UserDeserializer<TestAccessControlUser> {
    public async deserializeUser(req: {
        headers?: Record<string, string | string[] | undefined>;
    }): Promise<TestAccessControlUser | null> {
        const raw = req.headers?.["x-test-user"];
        if (!raw || Array.isArray(raw)) {
            return Promise.resolve(null);
        }

        return Promise.resolve(JSON.parse(raw) as TestAccessControlUser);
    }
}
