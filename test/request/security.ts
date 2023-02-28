import request from "supertest";
import {endpoints} from "../helper/routing";

export class Security {
    constructor(private readonly server: any) {
    }

    async getAllActiveSessions(refreshToken?: string) {
        const response = await request(this.server)
            .get(endpoints.securityController)
            .set('Cookie', `refreshToken=${refreshToken}`)
            .expect(200) // TODO Unauthorized

        return { body: response.body, status: response.status }
    }
}