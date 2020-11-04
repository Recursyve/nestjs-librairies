import { Attributes } from "./decorators/attributes.decorator";
import { Data } from "./decorators/data.decorator";
import { Accounts } from "./test/models/accounts/accounts.model";
import { Coords } from "./test/models/coords/coords.model";

@Data(Accounts)
class AccountsTest extends Accounts {
    @Attributes()
    coord: Coords;
}
