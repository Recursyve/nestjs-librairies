import { AccessActionType } from "../models";
import { RedisKeyUtils } from "./redis-key.utils";

describe("RedisKeyUtils", () => {
    const userWithoutRole = { id: "user1" };
    const userWithRole = { id: "user1", role: "admin" };

    describe("userResourceActionKey", () => {
        it("should return key without role segment when user has no role", () => {
            expect(RedisKeyUtils.userResourceActionKey(userWithoutRole, "posts", AccessActionType.Read))
                .toBe("access-control:user1:posts:r");
        });

        it("should return key with role segment when user has a role", () => {
            expect(RedisKeyUtils.userResourceActionKey(userWithRole, "posts", AccessActionType.Update))
                .toBe("access-control:user1-role@admin:posts:u");
        });
    });

    describe("userResourceActionWildcardKey", () => {
        it("should return wildcard key without role segment when user has no role", () => {
            expect(RedisKeyUtils.userResourceActionWildcardKey(userWithoutRole, "posts"))
                .toBe("access-control:user1:posts:wildcard");
        });

        it("should return wildcard key with role segment when user has a role", () => {
            expect(RedisKeyUtils.userResourceActionWildcardKey(userWithRole, "posts"))
                .toBe("access-control:user1-role@admin:posts:wildcard");
        });
    });

    describe("usersResourceActionWildcardPattern", () => {
        it("should return pattern with generic wildcard when no role is provided", () => {
            expect(RedisKeyUtils.usersResourceActionWildcardPattern("posts"))
                .toBe("access-control:*:posts:wildcard");
        });

        it("should return pattern with role-specific wildcard when role is provided", () => {
            expect(RedisKeyUtils.usersResourceActionWildcardPattern("posts", "admin"))
                .toBe("access-control:*-role@admin:posts:wildcard");
        });
    });

    describe("extractUserFromUsersResourceActionWildcardPatternMatch", () => {
        it.each([
            { userId: "user1" },
            { userId: "user-with-dashes" }
        ])("should extract user without role from matched key", ({ userId }) => {
            const result = RedisKeyUtils.extractUserFromUsersResourceActionWildcardPatternMatch(
                `access-control:${userId}:posts:wildcard`, "posts"
            );
            expect(result).toEqual({ id: userId });
        });

        it.each([
            { userId: "user1", role: "admin" },
            { userId: "user-with-dashes", role: "admin" },
            { userId: "user1", role: "super-admin" },
            { userId: "user-with-dashes", role: "super-admin" }
        ])("should extract user with role from matched key", ({ userId, role }) => {
            const result = RedisKeyUtils.extractUserFromUsersResourceActionWildcardPatternMatch(
                `access-control:${userId}-role@${role}:posts:wildcard`, "posts"
            );
            expect(result).toEqual({ id: userId, role });
        });

        it("should return null when key does not have the expected prefix", () => {
            const result = RedisKeyUtils.extractUserFromUsersResourceActionWildcardPatternMatch(
                "wrong-prefix:user1:posts:wildcard", "posts"
            );
            expect(result).toBeNull();
        });

        it("should return null when key does not match the resource/wildcard suffix", () => {
            const result = RedisKeyUtils.extractUserFromUsersResourceActionWildcardPatternMatch(
                "access-control:user1:comments:wildcard", "posts"
            );
            expect(result).toBeNull();
        });
    });

    describe("userResourceActionConditionKey", () => {
        it("should return condition key without role segment when user has no role", () => {
            expect(RedisKeyUtils.userResourceActionConditionKey(userWithoutRole, "posts"))
                .toBe("access-control:user1:posts:condition");
        });

        it("should return condition key with role segment when user has a role", () => {
            expect(RedisKeyUtils.userResourceActionConditionKey(userWithRole, "posts"))
                .toBe("access-control:user1-role@admin:posts:condition");
        });
    });

    describe("userResourceActionPattern", () => {
        it("should return pattern without role segment when user has no role", () => {
            expect(RedisKeyUtils.userResourceActionPattern(userWithoutRole, "posts"))
                .toBe("access-control:user1:posts:*");
        });

        it("should return pattern with role segment when user has a role", () => {
            expect(RedisKeyUtils.userResourceActionPattern(userWithRole, "posts"))
                .toBe("access-control:user1-role@admin:posts:*");
        });
    });

    describe("resourceActionPattern", () => {
        it("should return a pattern matching all users and actions for a resource", () => {
            expect(RedisKeyUtils.resourceActionPattern("posts"))
                .toBe("access-control:*:posts:*");
        });
    });

    describe("userResourceIdKey", () => {
        it("should return key without role when user has no role (numeric id)", () => {
            expect(RedisKeyUtils.userResourceIdKey("posts", 42, userWithoutRole))
                .toBe("access-control:posts:42:user1");
        });

        it("should return key with role when user has a role (string id)", () => {
            expect(RedisKeyUtils.userResourceIdKey("posts", "abc-123", userWithRole))
                .toBe("access-control:posts:abc-123:user1-role@admin");
        });
    });

    describe("userResourceIdPattern", () => {
        it("should return pattern without role suffix when no role is provided", () => {
            expect(RedisKeyUtils.userResourceIdPattern("posts", 42))
                .toBe("access-control:posts:42:*");
        });

        it("should return pattern with role suffix when role is provided", () => {
            expect(RedisKeyUtils.userResourceIdPattern("posts", 42, "admin"))
                .toBe("access-control:posts:42:*-role@admin");
        });
    });

    describe("extractUserFromUserResourceIdPatternMatch", () => {
        it.each([
            { userId: "user1" },
            { userId: "user-with-dashes" }
        ])("should extract user without role from matched key", ({ userId }) => {
            const result = RedisKeyUtils.extractUserFromUserResourceIdPatternMatch(
                `access-control:posts:42:${userId}`, "posts", 42
            );
            expect(result).toEqual({ id: userId });
        });

        it.each([
            { userId: "user1", role: "admin" },
            { userId: "user-with-dashes", role: "admin" },
            { userId: "user1", role: "super-admin" },
            { userId: "user-with-dashes", role: "super-admin" }
        ])("should extract user with role from matched key", ({ userId, role }) => {
            const result = RedisKeyUtils.extractUserFromUserResourceIdPatternMatch(
                `access-control:posts:42:${userId}-role@${role}`, "posts", 42
            );
            expect(result).toEqual({ id: userId, role });
        });

        it("should return null when key does not match the expected format", () => {
            const result = RedisKeyUtils.extractUserFromUserResourceIdPatternMatch(
                "wrong:format:key", "posts", 42
            );
            expect(result).toBeNull();
        });
    });

    describe("userAccessControl", () => {
        it("should return key without role segment when user has no role", () => {
            expect(RedisKeyUtils.userAccessControl(userWithoutRole, "posts"))
                .toBe("access-control:user1:posts");
        });

        it("should return key with role segment when user has a role", () => {
            expect(RedisKeyUtils.userAccessControl(userWithRole, "posts"))
                .toBe("access-control:user1-role@admin:posts");
        });
    });

    describe("userAccessControlType", () => {
        it("should return type key without role segment when user has no role", () => {
            expect(RedisKeyUtils.userAccessControlType(userWithoutRole, "posts"))
                .toBe("access-control:user1:posts:type");
        });

        it("should return type key with role segment when user has a role", () => {
            expect(RedisKeyUtils.userAccessControlType(userWithRole, "posts"))
                .toBe("access-control:user1-role@admin:posts:type");
        });
    });

    describe("extractUserFromKey", () => {
        it.each([
            { key: "user1", expectedResult: { id: "user1" } },
            { key: "user-with-dashes", expectedResult: { id: "user-with-dashes" } },
            { key: "user1-role@admin", expectedResult: { id: "user1", role: "admin" } },
            { key: "user-with-dashes-role@admin", expectedResult: { id: "user-with-dashes", role: "admin" } },
            { key: "user1-role@super-admin", expectedResult: { id: "user1", role: "super-admin" } },
            { key: "user-with-dashes-role@super-admin", expectedResult: { id: "user-with-dashes", role: "super-admin" } }
        ])("should return user", ({ key, expectedResult }) => {
            expect(RedisKeyUtils.extractUserFromKey(key)).toEqual(expectedResult);
        });
    });
});
