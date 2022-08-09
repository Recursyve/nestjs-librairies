export const GEO_POINT_SRID = 4326;

export class GeoPoint {
    public type = "Point";

    constructor(public coordinates: number[]) {}
}

export class SequelizeUtils {
    public static formatInstanceDateOnly(instance: any): void {
        if (!instance || typeof instance !== "object") {
            return;
        }

        for (const key in instance.dataValues) {
            if (!instance.dataValues.hasOwnProperty(key)) {
                continue;
            }

            if (key in instance.rawAttributes) {
                const designType = Reflect.getMetadata("design:type", instance, key);
                if (instance.rawAttributes[key].type.key === "DATEONLY" && designType === Date && instance.dataValues[key]) {
                    instance.dataValues[key] = new Date(instance.dataValues[key]);
                }
            } else if (Array.isArray(instance.dataValues[key])) {
                instance.dataValues[key].forEach(SequelizeUtils.formatInstanceDateOnly);
            } else if (typeof instance.dataValues[key] === "object") {
                SequelizeUtils.formatInstanceDateOnly(instance.dataValues[key]);
            }
        }
    }
}
