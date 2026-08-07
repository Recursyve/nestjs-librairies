import { Attributes, Data } from "@recursyve/nestjs-data-filter";
import { Artifacts } from "../../artifacts/models/artifacts.model";
import { Museums } from "../models/museums.model";

@Data(Museums)
@Attributes(["name"])
export class MuseumsWithArtifactsData extends Museums {
    @Attributes(["title", "status", "display_rank"])
    declare artifacts?: Artifacts[];
}
