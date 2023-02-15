import request from "supertest";
import {PostViewModel} from "../../src/modules/public/posts/api/dto/postsView.model";
import {endpoints, getUrlWithId} from "../helper/routing";
import {ContentPageModel} from "../../src/global-model/contentPage.model";

export class Posts {
    constructor(private readonly server: any) {
    }

    async addReaction(accessToken: string, url, status: string) {
        const response = await request(this.server)
            .put(url)
            .auth(accessToken, { type: 'bearer' })
            .send({
                likeStatus: `${status}`
            })

        return {status: response.status, errorsMessages: response.body}
    }

    async getPostById(postId: string, accessToken?: string) {
        const url = getUrlWithId(endpoints.postController, postId)

        if (!accessToken) {
            const response = await request(this.server).get(url)
            return {status: response.statusCode, body: response.body}
        }

        const response = await request(this.server)
            .get(url)
            .auth(accessToken, { type: 'bearer' })

        return {status: response.statusCode, body: response.body}
    }

    async getPosts(accessToken?: string) {
        if (!accessToken) {
            const response = await request(this.server)
                .get(endpoints.postController)

            return {status: response.statusCode, body: response.body}
        }

        const response = await request(this.server)
            .get(endpoints.postController)
            .auth(accessToken, { type: 'bearer' })

        return {status: response.statusCode, body: response.body}
    }
}