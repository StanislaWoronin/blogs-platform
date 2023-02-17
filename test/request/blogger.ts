import request from 'supertest';
import {endpoints, getUrlForBanned} from "../helper/routing";
import {faker} from "@faker-js/faker";

export class Blogger {
    constructor(private readonly server: any) {
    }

    async banUser(accessToken: string, userId: string, blogId: string, banStatus: boolean) {
        const url = getUrlForBanned(endpoints.bloggerController.users[''], userId)

        const response = await request(this.server)
            .put(url)
            .auth(accessToken, {type: "bearer"})
            .send({
                isBanned: banStatus,
                banReason: faker.random.alpha(20),
                blogId: blogId
            })

        return { status: response.status, errorsMessages: response.body }
    }
}