export class ObjectUtils {
    public static forEachProperty(
        object: Object,
        valueHandle: (value: any) => any,
        objectHandle?: (object: Object) => void
    ) {
        for (const property in object) {
            if (!object.hasOwnProperty || object.hasOwnProperty(property)) {
                const value = object[property];
                if (value instanceof Array) {
                    for (let i = 0; i < value.length; ++i) {
                        value[i] = valueHandle(value[i]);
                    }
                } else if (objectHandle && value instanceof Object) {
                    objectHandle(object[property]);
                } else {
                    object[property] = valueHandle(object[property]);
                }
            }
        }
    }

    public static objectToArrayOfProperties(object: Object, deep = false): any[] {
        // Convert object properties to array.
        const properties: any[] = [];
        this.forEachProperty(
            object,
            value => {
                properties.push(value);
                return value;
            },
            !deep
                ? null
                : deepObject => {
                      properties.push(this.objectToArrayOfProperties(deepObject));
                  }
        );
        return properties;
    }

    public static stringBoolsToBools(object: Object) {
        ObjectUtils.forEachProperty(
            object,
            (value: any) => {
                if (value === "true") {
                    return true;
                }
                if (value === "false") {
                    return false;
                }
                return value;
            },
            this.stringBoolsToBools
        );
    }
}
