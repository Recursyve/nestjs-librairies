import { isNotEmpty } from "@recursyve/nice-ts-utils";

import type { AccessActionType } from "../models/access-rules.model";
import type { ResourceId } from "../models/resources.model";
import type { Users } from "../models/users.model";

export namespace RedisKeyUtils {
    export const prefix = "access-control";
    export const rolePrefix = "role@";

    export function userResourceActionKey(user: Users, resourceName: string, action: AccessActionType): string {
        if (isNotEmpty(user.role)) {
            return `${prefix}:${user.id}-${rolePrefix}${user.role}:${resourceName}:${action}`;
        }

        return `${prefix}:${user.id}:${resourceName}:${action}`;
    }

    export function userResourceActionWildcardKey(user: Users, resourceName: string): string {
        if (isNotEmpty(user.role)) {
            return `${prefix}:${user.id}-${rolePrefix}${user.role}:${resourceName}:wildcard`;
        }

        return `${prefix}:${user.id}:${resourceName}:wildcard`;
    }

    export function usersResourceActionWildcardPattern(resourceName: string, role?: string): string {
        if (isNotEmpty(role)) {
            return `${prefix}:*-${rolePrefix}${role}:${resourceName}:wildcard`;
        }

        return `${prefix}:*:${resourceName}:wildcard`;
    }

    export function extractUserFromUsersResourceActionWildcardPatternMatch(
        matchedKey: string,
        resourceName: string
    ): Users | null {
        const keyWithoutPrefix = matchedKey.replace(`${prefix}:`, "");
        if (keyWithoutPrefix === matchedKey) {
            return null;
        }

        const userIdAndMaybeRole = keyWithoutPrefix.replace(`:${resourceName}:wildcard`, "");
        if (userIdAndMaybeRole === keyWithoutPrefix) {
            return null;
        }

        return extractUserFromKey(userIdAndMaybeRole);
    }

    export function userResourceActionConditionKey(user: Users, resourceName: string): string {
        if (isNotEmpty(user.role)) {
            return `${prefix}:${user.id}-${rolePrefix}${user.role}:${resourceName}:condition`;
        }

        return `${prefix}:${user.id}:${resourceName}:condition`;
    }

    export function userResourceActionPattern(user: Users, resourceName: string): string {
        if (isNotEmpty(user.role)) {
            return `${prefix}:${user.id}-${rolePrefix}${user.role}:${resourceName}:*`;
        }

        return `${prefix}:${user.id}:${resourceName}:*`;
    }

    export function resourceActionPattern(resourceName: string): string {
        return `${prefix}:*:${resourceName}:*`;
    }

    export function userResourceIdKey(resourceName: string, resourceId: ResourceId, user: Users): string {
        if (isNotEmpty(user.role)) {
            return `${prefix}:${resourceName}:${resourceId}:${user.id}-${rolePrefix}${user.role}`;
        }

        return `${prefix}:${resourceName}:${resourceId}:${user.id}`;
    }

    export function userResourceIdPattern(resourceName: string, resourceId: ResourceId, role?: string): string {
        const pattern = `${prefix}:${resourceName}:${resourceId}:*`;
        if (isNotEmpty(role)) {
            return `${pattern}-${rolePrefix}${role}`;
        }

        return pattern;
    }

    export function extractUserFromUserResourceIdPatternMatch(
        matchedKey: string,
        resourceName: string,
        resourceId: ResourceId
    ): Users | null {
        const userIdAndMaybeRole = matchedKey.replace(`${prefix}:${resourceName}:${resourceId}:`, "");
        if (userIdAndMaybeRole === matchedKey) {
            // The matched key was not in the expected format
            return null;
        }

        return extractUserFromKey(userIdAndMaybeRole);
    }

    export function userAccessControl(user: Users, resourceName: string): string {
        if (isNotEmpty(user.role)) {
            return `${prefix}:${user.id}-${rolePrefix}${user.role}:${resourceName}`;
        }

        return `${prefix}:${user.id}:${resourceName}`;
    }

    export function userAccessControlType(user: Users, resourceName: string): string {
        if (isNotEmpty(user.role)) {
            return `${prefix}:${user.id}-${rolePrefix}${user.role}:${resourceName}:type`;
        }

        return `${prefix}:${user.id}:${resourceName}:type`;
    }

    export function extractUserFromKey(key: string): Users {
        const roleMarker = `-${rolePrefix}`;
        const roleMarkerIndex = key.indexOf(roleMarker);
        if (roleMarkerIndex === -1) {
            return { id: key };
        }

        return {
            id: key.slice(0, roleMarkerIndex),
            role: key.slice(roleMarkerIndex + roleMarker.length)
        };
    }
}
