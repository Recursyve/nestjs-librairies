import { AccessActionType } from "../models";

export class RedisKeyUtils {
    public static prefix = "access-control";

    public static userResourceActionKey(userId: string, table: string, action: AccessActionType): string {
        return `${this.prefix}:${userId}:${table}:${action}`;
    }

    public static userResourceActionPattern(userId: string, table: string): string {
        return `${this.prefix}:${userId}:${table}:*`;
    }

    public static resourceActionPattern(table: string): string {
        return `${this.prefix}:*:${table}:*`;
    }

    public static userResourceIdKey(table: string, resourceId: number, userId: string): string {
        return `${this.prefix}:${table}:${resourceId}:${userId}`;
    }

    public static userResourceIdPattern(table: string, resourceId: number): string {
        return `${this.prefix}:${table}:${resourceId}:*`;
    }

    public static userAccessControl(userId: string, table: string): string {
        return `${this.prefix}:${userId}:${table}`;
    }
}
