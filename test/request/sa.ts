import {endpoints, getUrlForBanned} from "../helper/routing";
import request from "supertest";
import {banUserDto, superUser} from "../helper/prepeared-data";

export class SA {
    constructor(private readonly server: any) {
    }

    async saBannedUser(userId: string, banStatus: boolean) {
        const url = getUrlForBanned(endpoints.sa.users, userId)

        let dto = banUserDto.validBan
        if(!banStatus) {
            dto = banUserDto.validUnBun
        }

        const response = await request(this.server)
            .put(url)
            .auth(superUser.valid.login, superUser.valid.password, {type: "basic"})
            .send(dto)

        return {status: response.status, errorsMessages: response.body}
    }
}