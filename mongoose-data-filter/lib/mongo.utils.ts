import { RuleModel } from "./filter/models";
import { AddFieldModel } from "./models/add-field.model";
import { FilterOperatorTypes } from "./filter";
import { FilterQuery } from "mongoose";

export class MongoUtils {
    public static generateWhereValue(rule: RuleModel): FilterQuery<any> {
        switch (rule.operation) {
            case "equal":
                return rule.value as any;

            case "not_equal":
                return { $ne: rule.value };

            case "in":
                return { $in: rule.value as any[] };

            case "not_in":
                return { $nin: rule.value as any[] };

            case "less":
                return { $lt: rule.value as any };

            case "less_or_equal":
                return { $lte: rule.value as any };

            case "greater":
                return { $gt: rule.value as any };

            case "greater_or_equal":
                return { $gte: rule.value as any };

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

            case FilterOperatorTypes.Exists:
                return { $exists: rule.value as any }
        }
    }

    public static reduceLookups(lookups: any[][]): any[] {
        const results = [];
        for (const lookup of lookups) {
            this.mergeLookups(results, lookup);
        }
        return results;
    }

    public static mergeLookups(a: any[], b: any[]): any[] {
        for (const bChild of b) {
            if (bChild.$lookup) {
                const aChild = a.find((x) => x.$lookup?.from === bChild.$lookup.from && x.$lookup?.as === bChild.$lookup.as);
                if (aChild) {
                    aChild.$lookup.pipeline = this.mergeLookups(aChild.$lookup.pipeline ?? [], bChild.$lookup.pipeline ?? []);
                } else {
                    a.push(bChild);
                }
            } else if (bChild.$unwind) {
                const aChild = a.find((x) => x.$unwind?.path === bChild.$unwind.path);
                if (!aChild) {
                    a.push(bChild);
                }
            }
        }

        return a;
    }

    public static generateSearchCondition(fields: string[], search: string): object {
        if (!search) {
            return {};
        }

        return {
            $or: fields.map((x) => ({
                [x]: new RegExp(`.*${search}.*`, "i")
            }))
        };
    }

    public static reduceFieldsToAdd(fieldsToAdd: AddFieldModel[]): any {
        return fieldsToAdd
            .map((x) => x.transform())
            .reduce(
                (previous, current) => ({
                    ...previous,
                    ...current
                }),
                {}
            );
    }
}
