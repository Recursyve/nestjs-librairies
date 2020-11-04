import { QuerySelector } from "mongodb";
import { RuleModel } from "../../data-filter/lib/filter/models";

export class MongoUtils {
    public static generateWhereValue(rule: RuleModel): QuerySelector<any> {
        switch (rule.operation) {
            case "equal":
                return rule.value as any;

            case "not_equal":
                return { $ne: rule.value };

            case "in":
                return { $in : rule.value as any[] };

            case "not_in":
                return { $nin: rule.value as any[] };

            case "less":
                return { $lt: rule.value as any};

            case "less_or_equal":
                return { $lte: rule.value as any};

            case "greater":
                return { $gt: rule.value as any};

            case "greater_or_equal":
                return { $gte: rule.value as any};

            case "between":
                return {
                    $gte: rule.value[0],
                    $lte: rule.value[1]
                };

            case "not_between":
                return {
                    $lt: rule.value[0],
                    $gt: rule.value[1]
                };

            case "is_null":
                return { $eq: null };

            case "is_not_null":
                return { $ne: null };

            case "begins_with":
                return { $eq: new RegExp(`${rule.value}.*`, "i") };

            case "not_begins_with":
                return { $not: new RegExp(`${rule.value}.*`, "i") };

            case "contains":
                return { $eq: new RegExp(`.*${rule.value}.*`, "i") };

            case "not_contains":
                return { $not: new RegExp(`.*${rule.value}.*`, "i") };

            case "ends_with":
                return { $eq: new RegExp(`.*${rule.value}`, "i") };

            case "not_ends_with":
                return { $not: new RegExp(`.*${rule.value}`, "i") };

            case "is_empty":
                return { $eq: "" };

            case "is_not_empty":
                return { $ne: "" };
        }
    }

    public static reduceLookups(lookups: any[][]): any[] {
        const results = [];
        for (const lookup of lookups) {
            const exist = results.findIndex(x => x.as === lookup.as) >= 0;
        }
        return results;
    }

    public static mergeLookups(a: any[], b: any[]): any[] {
        const [bLookup] = b;
        const exist = a.findIndex(x => x.as === bLookup.as) >=0;
        if (!exist) {
            a.push(...b);
        }

        return a;
    }
}
