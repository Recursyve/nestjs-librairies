import { Injectable } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { col, fn } from "sequelize";
import { Attributes, BaseFilter, Data, DataFilterModule, NumberFilter } from "../index";
import { DataFilterScanner } from "../scanners/data-filter.scanner";
import { SequelizeModelScanner } from "../scanners/sequelize-model.scanner";
import { ContractSystems } from "../test/models/contracts/contract-systems.model";

@Data(ContractSystems)
@Attributes(["active"])
class ContractSystemsTest {}

@Injectable()
export class TestFilter extends BaseFilter<ContractSystemsTest> {
    public dataDefinition = ContractSystemsTest;

    public visitCount = new NumberFilter({
        attribute: "id",
        path: "visits.visit",
        group: "visit",
        having: fn("count", col("visits.visit.id"))
    });

    constructor(scanner: SequelizeModelScanner, scanner2: DataFilterScanner) {
        super();
    }
}

describe("FilterFactory", () => {
    it("with missing dependencies should throw an error", async () => {
        expect.assertions(1);
        await expect(Test.createTestingModule({
            imports: [
                DataFilterModule.forRoot(),
                DataFilterModule.forFeature({
                    filters: [
                        {
                            filter: TestFilter
                        }
                    ]
                })
            ]
        }).compile()).rejects.toEqual(new Error("Not enough dependencies were provided for TestFilter: expected 2, received 0"));
    });
});
