import request from "supertest";
import {PostViewModel} from "../../src/modules/public/posts/api/dto/postsView.model";
import {endpoints, getUrlWithId} from "./routing";

export class Response {
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

    async getPostById(postId: string, accessToken?: string): Promise<PostViewModel> {
        const url = getUrlWithId(endpoints.postController, postId)

        if (!accessToken) {
            const response = await request(this.server).get(url)
            return response.body
        }

        const response = await request(this.server)
            .get(url)
            .auth(accessToken, { type: 'bearer' })
        console.log(response.status)
        return response.body
    }
}