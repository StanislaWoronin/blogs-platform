import {endpoints} from "../helper/routing";
import request from "supertest";

export class Auth {
    constructor(private readonly server: any) {
    }

    async getNewRefreshToken(refreshToken?: string) {
        const response = await request(this.server)
            .post(endpoints.authController.refreshToken)
            .auth(refreshToken, {type: "bearer"})
            .set('Cookie', `refreshToken=${refreshToken}`)

        if(!response.body) {
            return response.status
        }
        return response.body
    }

}