import { AccessActionType, ResourceId, Users } from "../models";

export class RedisKeyUtils {
    public static prefix = "access-control";

    public static userResourceActionKey(user: Users, resourceName: string, action: AccessActionType): string {
        if (!user.role) {
            return `${this.prefix}:${user.id}:${resourceName}:${action}`;
        }
        return `${this.prefix}:${user.id}-${user.role}:${resourceName}:${action}`;
    }

    public static userResourceActionWildcardKey(user: Users, resourceName: string): string {
        if (!user.role) {
            return `${this.prefix}:${user.id}:${resourceName}:wildcard`;
        }
        return `${this.prefix}:${user.id}-${user.role}:${resourceName}:wildcard`;
    }

    public static userResourceActionConditionKey(user: Users, resourceName: string): string {
        if (!user.role) {
            return `${this.prefix}:${user.id}:${resourceName}::condition`;
        }
        return `${this.prefix}:${user.id}-${user.role}:${resourceName}:condition`;
    }

    public static userResourceActionPattern(user: Users, resourceName: string): string {
        if (!user.role) {
            return `${this.prefix}:${user.id}:${resourceName}:*`;
        }
        return `${this.prefix}:${user.id}-${user.role}:${resourceName}:*`;
    }

    public static resourceActionPattern(resourceName: string): string {
        return `${this.prefix}:*:${resourceName}:*`;
    }

    public static userResourceIdKey(resourceName: string, resourceId: ResourceId, user: Users): string {
        if (!user.role) {
            return `${this.prefix}:${resourceName}:${resourceId}:${user.id}`;
        }
        return `${this.prefix}:${resourceName}:${resourceId}:${user.id}-${user.role}`;
    }

    public static userResourceIdPattern(resourceName: string, resourceId: ResourceId, role?: string): string {
        const pattern = `${this.prefix}:${resourceName}:${resourceId}:*`;
        if (!role) {
            return pattern;
        }

        return `${pattern}-${role}`;
    }

    public static extractUserFromUserResourceIdPatternMatch(
        matchedKey: string,
        resourceName: string,
        resourceId: ResourceId
    ): Users | null {
        const userIdAndMaybeRole = matchedKey.replace(`${this.prefix}:${resourceName}:${resourceId}:`, "");
        if (userIdAndMaybeRole === matchedKey) {
            // The matched key was not in the expected format
            return null;
        }

        const [id, role] = userIdAndMaybeRole.split("-");
        return { id, role };
    }

    public static userAccessControl(user: Users, resourceName: string): string {
        if (!user.role) {
            return `${this.prefix}:${user.id}:${resourceName}`;
        }
        return `${this.prefix}:${user.id}-${user.role}:${resourceName}`;
    }

    public static userAccessControlType(user: Users, resourceName: string): string {
        if (!user.role) {
            return `${this.prefix}:${user.id}:${resourceName}:type`;
        }
        return `${this.prefix}:${user.id}-${user.role}:${resourceName}:type`;
    }
}
