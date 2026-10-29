import { beforeEach, describe, expect, it, vi } from "vitest";

import { PolicyResources } from "../models/resources.model";
import { GetResourcesQuery } from "../queries/get-resources.query";
import type { AccessPoliciesService } from "../services/access-policies.service";
import { AccessControlGetResourcesHandler } from "./get-resources.handler";

describe(AccessControlGetResourcesHandler, () => {
    let accessPoliciesService: Pick<AccessPoliciesService, "execute">;
    let underTest: AccessControlGetResourcesHandler;

    beforeEach(() => {
        accessPoliciesService = { execute: vi.fn<AccessPoliciesService["execute"]>() };
        underTest = new AccessControlGetResourcesHandler(accessPoliciesService as AccessPoliciesService);
    });

    it("delegates to AccessPoliciesService with resource name and user", async () => {
        expect.assertions(2);

        const user = { id: "user-1" };
        const expected = PolicyResources.resources([]);
        vi.mocked(accessPoliciesService.execute).mockResolvedValue(expected);

        const result = await underTest.execute(new GetResourcesQuery("posts", user));

        expect(accessPoliciesService.execute).toHaveBeenCalledWith("posts", user);
        expect(result).toBe(expected);
    });
});
