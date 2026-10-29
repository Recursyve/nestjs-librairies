import { assert, describe, expect, it } from "vitest";

import { ConfigHandler } from "../handlers/config.handler";
import { Variable } from "./variable.decorator";

class BooleanRequiredModel {
    @Variable(false)
    public optionalFlag!: string;

    @Variable(true)
    public requiredFlag!: string;
}

class StringNameModel {
    @Variable("CUSTOM_ENV_NAME")
    public localName!: string;
}

class ObjectConfigModel {
    @Variable({
        variableName: "OBJECT_VAR",
        required: false
    })
    public field!: string;
}

class DefaultRequiredModel {
    @Variable
    public IMPLICIT_NAME!: string;
}

describe(Variable, () => {
    it("maps false to optional variable metadata", () => {
        expect.assertions(1);

        const variable = ConfigHandler.getVariable(BooleanRequiredModel, "optionalFlag");

        expect(variable).toStrictEqual({
            propertyKey: "optionalFlag",
            variableName: "optionalFlag",
            required: false
        });
    });

    it("maps true to required variable metadata", () => {
        expect.assertions(1);

        const variable = ConfigHandler.getVariable(BooleanRequiredModel, "requiredFlag");
        assert(variable);

        expect(variable.required).toBe(true);
    });

    it("maps a string argument to variableName", () => {
        expect.assertions(1);

        const variable = ConfigHandler.getVariable(StringNameModel, "localName");

        expect(variable).toStrictEqual({
            propertyKey: "localName",
            variableName: "CUSTOM_ENV_NAME",
            required: true
        });
    });

    it("maps object config", () => {
        expect.assertions(1);

        const variable = ConfigHandler.getVariable(ObjectConfigModel, "field");

        expect(variable).toStrictEqual({
            propertyKey: "field",
            variableName: "OBJECT_VAR",
            required: false
        });
    });

    it("defaults variableName to propertyKey and required to true", () => {
        expect.assertions(1);

        const variable = ConfigHandler.getVariable(DefaultRequiredModel, "IMPLICIT_NAME");

        expect(variable).toStrictEqual({
            propertyKey: "IMPLICIT_NAME",
            variableName: "IMPLICIT_NAME",
            required: true
        });
    });

    it("returns null for unknown properties", () => {
        expect.assertions(1);

        const variable = ConfigHandler.getVariable(DefaultRequiredModel, "missing");

        expect(variable).toBeNull();
    });
});
