import "reflect-metadata";

export function createDateOnlyInstance(value: string): {
    dataValues: Record<string, unknown>;
    rawAttributes: Record<string, { type: { key: string } }>;
} {
    const instance = {
        dataValues: { birthDate: value },
        rawAttributes: {
            birthDate: { type: { key: "DATEONLY" } }
        }
    };

    Reflect.defineMetadata("design:type", Date, instance, "birthDate");

    return instance;
}
