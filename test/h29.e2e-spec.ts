import {HttpStatus, INestApplication} from "@nestjs/common";
import {Blogger} from "./request/blogger";
import {Comments} from "./request/comments";
import {Factories} from "./helper/factories";
import {Posts} from "./request/posts";
import {SA} from "./request/sa";
import {Blogs} from "./request/blogs";
import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../src/app.module";
import {EmailManager} from "../src/modules/public/auth/email-transfer/email.manager";
import {EmailManagerMock} from "./mock/emailAdapter.mock";
import {createApp} from "../src/helpers/create-app";
import {Testing} from "./request/testing";
import {ImageStatus} from "./images/image-status.enum";

describe('e2e tests', () => {
    const second = 1000;
    jest.setTimeout(10 * second);

    let app: INestApplication;
    let server;
    let blogger: Blogger;
    let comments: Comments;
    let factories: Factories;
    let posts: Posts;
    let sa: SA;
    let blogs: Blogs;
    let testing: Testing;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(EmailManager)
            .useValue(new EmailManagerMock())
            .compile();

        const rawApp = await moduleFixture.createNestApplication();
        app = createApp(rawApp);
        await app.init();
        server = await app.getHttpServer();
        blogger = new Blogger(server);
        blogs = new Blogs(server);
        comments = new Comments(server);
        factories = new Factories(server);
        posts = new Posts(server);
        sa = new SA(server);
        testing = new Testing(server);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Upload background wallpaper', () => {
        it('Cleare data base', async () => {
            await testing.clearDb();
        })

        it('Create testing date', async () => {
            const users = await factories.createAndLoginUsers(2)
            const fistUserBlog = await blogger.createBlog(users[0].accessToken)
            const secondUserBlog = await blogger.createBlog(users[1].accessToken)
            console.log('accessToken:', users[0].accessToken)
            console.log('fistUserBlogId:', fistUserBlog.body.id,)
            expect.setState({
                accessToken: users[0].accessToken,
                userId: users[0].user.id,
                fistUserBlogId: fistUserBlog.body.id,
                secondUserBlogId: secondUserBlog.body.id
            })
        })

        it.skip(`Status: ${HttpStatus.FORBIDDEN}.
         If user try to update blog that doesn't belong to current user.`, async () => {
            const { accessToken, secondUserBlogId } = expect.getState()

            const result = await blogger.uploadBackgroundWallpaper(secondUserBlogId, ImageStatus.Valid, accessToken)
            expect(result.status).toBe(HttpStatus.FORBIDDEN)
        })

        it.skip(`Status: ${HttpStatus.UNAUTHORIZED}.
         If user try to update without credentials.`, async () => {
            const { fistUserBlogId, accessToken} = expect.getState()
            const result = await blogger.uploadBackgroundWallpaper(fistUserBlogId, ImageStatus.Valid)
            expect(result.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it.skip(`Status: ${HttpStatus.OK}.
         Upload image.`, async () => {
            const { fistUserBlogId, accessToken} = expect.getState()
            const result = await blogger.uploadBackgroundWallpaper(fistUserBlogId, ImageStatus.Valid, accessToken)
            expect(result.status).toBe(HttpStatus.OK)
        })
    });
})
