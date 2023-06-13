import {HttpStatus, INestApplication} from "@nestjs/common";
import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../src/app.module";
import {EmailManager} from "../src/modules/public/auth/email-transfer/email.manager";
import {EmailManagerMock} from "./mock/emailAdapter.mock";
import {createApp} from "../src/helpers/create-app";
import {TEST} from "./request/test";
import {settings} from "../src/settings";
import {randomUUID} from "crypto";

describe('e2e tests', () => {
    const second = 1000;
    jest.setTimeout(5 * second);

    let app: INestApplication;
    let server;
    let test: TEST;

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
        test = new TEST(server)
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Subscribe to telegram', () => {
        it('Clear data base', async () => {
            await test.testing().clearDb()
        });

        it('Create data', async () => {
            const [user] = await test.factories().createAndLoginUsers(1)
            console.log("userId:", user.user.id)
            console.log("accessToken:", user.accessToken)

            expect.setState({accessToken: user.accessToken})
        })

        it('Try get telegram link without authorization.', async () => {
            const response = await test.integration().getTelegramInviteLink()
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('Get telegram link.', async () => {
            const {accessToken} = expect.getState()
            const response = await test.integration().getTelegramInviteLink(accessToken)
            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body.link).toBeDefined()

            const [botLink, other] = response.body.link.split('?')
            expect(botLink).toStrictEqual(settings.telegram.botInviteLink)

            const [parameter, code] = other.split('=')
            expect(parameter).toBe('code')
            expect(code).toStrictEqual(expect.any(String))
            console.log(response.body.link)
        })
    })


    describe('Subscribe to blog', () => {
        it('Create blog', async () => {
            await test
        })

        it('404', async () => {
            const randomBlogId = randomUUID()
            await test.blogs().subscribeToBlog(randomBlogId)
        })
    })
})