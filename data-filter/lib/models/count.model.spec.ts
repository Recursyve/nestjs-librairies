import { fn, literal, Op, ProjectionAlias } from "sequelize";
import { CountAttributesConfig } from "./count.model";

describe("CountAttributesConfig", () => {
    describe("transform", () => {
        it("counts the attribute when no where is set", () => {
            const config = new CountAttributesConfig("applicantsCount", {
                name: "applicantsCount",
                attribute: "id",
                path: "jobApplications"
            });

            expect(config.transform({})).toStrictEqual<ProjectionAlias>([
                fn("COUNT", literal("`jobApplications`.`id`")),
                "applicantsCount"
            ]);
        });

        it("inlines the where in the COUNT so two filters on the same path stay independent", () => {
            const exported = new CountAttributesConfig("applicantsCount", {
                name: "applicantsCount",
                attribute: "id",
                path: "jobApplications",
                where: { exportedAt: () => ({ [Op.not]: null }) }
            });
            const unexported = new CountAttributesConfig("unexportedApplicantsCount", {
                name: "unexportedApplicantsCount",
                attribute: "id",
                path: "jobApplications",
                where: { exportedAt: () => null }
            });

            expect(exported.transform({})).toStrictEqual<ProjectionAlias>([
                literal("COUNT(CASE WHEN `jobApplications`.`exportedAt` IS NOT NULL THEN `jobApplications`.`id` END)"),
                "applicantsCount"
            ]);
            expect(unexported.transform({})).toStrictEqual<ProjectionAlias>([
                literal("COUNT(CASE WHEN `jobApplications`.`exportedAt` IS NULL THEN `jobApplications`.`id` END)"),
                "unexportedApplicantsCount"
            ]);
        });

        it("keeps DISTINCT around the filtered expression", () => {
            const config = new CountAttributesConfig("skuCount", {
                name: "skuCount",
                attribute: "sku",
                path: "lines",
                distinct: true,
                where: { quantity: () => ({ [Op.gte]: 5 }) }
            });

            expect(config.transform({})).toStrictEqual<ProjectionAlias>([
                literal("COUNT(DISTINCT CASE WHEN `lines`.`quantity` >= 5 THEN `lines`.`sku` END)"),
                "skuCount"
            ]);
        });
    });
});
