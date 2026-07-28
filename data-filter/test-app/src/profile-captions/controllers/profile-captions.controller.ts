import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { ProfileCaptionsData, ProfileCaptionsFilter } from "../filters/profile-captions.filter";

@Controller("profile-captions")
export class ProfileCaptionsController extends FilterController<ProfileCaptionsData> {
    constructor(@InjectFilter(ProfileCaptionsFilter) filterService: FilterService<ProfileCaptionsData>) {
        super(filterService);
    }
}
