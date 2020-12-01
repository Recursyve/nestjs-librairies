import { Variable } from "../decorators";
import { VariableScanner } from "./variable.scanner";
import { VariableModel } from "../models/variable.model";

class VariableTest {
    @Variable(false)
    DB_HOST: string;

    @Variable({
        variableName: "DB_NAME",
        required: false
    })
    dbName: string;

    @Variable
    DB_PORT: string;
}

describe("VariableScanner", () => {
    let scanner: VariableScanner;

    beforeAll(() => {
        scanner = new VariableScanner();
    });

    it("getVariables should return the valid VariableConfig array", () => {
        const variables = scanner.getVariables(VariableTest);
        expect(variables).toBeDefined();

        const expected = [
            {
                propertyKey: "DB_HOST",
                variableName: "DB_HOST",
                required: false
            } as VariableModel,

            {
                propertyKey: "dbName",
                variableName: "DB_NAME",
                required: false
            } as VariableModel,

            {
                propertyKey: "DB_PORT",
                variableName: "DB_PORT",
                required: true
            } as VariableModel
        ];

        expect(variables).toEqual(
            expect.arrayContaining(expected)
        );
    });
});
