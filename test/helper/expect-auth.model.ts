import {UserViewModelWithBanInfo} from "../../src/modules/super-admin/api/dto/user.view.model";

export const ExpectAuthModel = (user: UserViewModelWithBanInfo) => {
    return {
        userId: user.id,
        login: user.login,
        email: user.email
    }
}