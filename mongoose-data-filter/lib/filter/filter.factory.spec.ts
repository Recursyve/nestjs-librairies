import { Injectable } from "@nestjs/common";
import { Data } from "../decorators/data.decorator";
import { Places } from "../test/models/places/places.model";
import { BaseFilter } from "./base-filter";
import { TextFilter } from "./filters";

@Data(Places)
class PlacesTest {}

@Injectable()
export class TestFilter extends BaseFilter<PlacesTest> {
    public dataDefinition = PlacesTest;

    public address = new TextFilter({
        attribute: "address",
        path: "geoCoord",
        group: "places"
    });
}

describe("FilterFactory", () => {
    it("with missing dependencies should throw an error", async () => {
        // TODO: Test
    });
});
