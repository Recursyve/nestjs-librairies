import { AccessActionType, Users } from "../models";

export class RedisKeyUtils {
    public static prefix = "access-control";

    public static userResourceActionKey(user: Users, table: string, action: AccessActionType): string {
        return `${this.prefix}:${user.id}-${user.role}:${table}:${action}`;
    }

    public static userResourceActionPattern(user: Users, table: string): string {
        return `${this.prefix}:${user.id}-${user.role}:${table}:*`;
    }

    public static resourceActionPattern(table: string): string {
        return `${this.prefix}:*:${table}:*`;
    }

    public static userResourceIdKey(table: string, resourceId: number, user: Users): string {
        return `${this.prefix}:${table}:${resourceId}:${user.id}-${user.role}`;
    }

    public static userResourceIdPattern(table: string, resourceId: number): string {
        return `${this.prefix}:${table}:${resourceId}:*`;
    }

    public static userAccessControl(user: Users, table: string): string {
        return `${this.prefix}:${user.id}-${user.role}:${table}`;
    }
}
