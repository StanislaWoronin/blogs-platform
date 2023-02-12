import {INestApplication} from "@nestjs/common";
import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../src/app.module";
import {EmailManager} from "../src/modules/public/auth/email-transfer/email.manager";
import {EmailManagerMock} from "./mock/emailAdapter.mock";
import {createApp} from "../src/helpers/create-app";
import request from "supertest";
import {preparedUser} from "./helper/prepeared-data";
import {getAllDevices} from "./helper/expect-seurity.model";
import {randomUUID} from "crypto";

describe('e2e tests', () => {
    const second = 1000;
    jest.setTimeout(30 * second);

    let app: INestApplication;
    let server;

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
    });

    afterAll(async () => {
        await app.close();
    });

    it('Drop all data.', async () => {
        await request(server)
            .delete('/testing/all-data')
            .expect(204)
    })

    describe('Security router testing', () => {
        it('Create devises', async () => {
            // For first user
            await request(server)
                .post('/auth/registration')
                .send(preparedUser.valid1)
                .expect(204)

            const login1 = await request(server)
                .post('/auth/login')
                .send(preparedUser.login1)
                .set({ 'user-agent': 'chrome/0.1' })
                .expect(200)

            await request(server)
                .post('/auth/login')
                .send(preparedUser.login1)
                .set({ 'user-agent': 'chrome/0.2' })
                .expect(200)

            await request(server)
                .post('/auth/login')
                .send(preparedUser.login1)
                .set({ 'user-agent': 'chrome/0.3' })
                .expect(200)

            // For second user
            await request(server)
                .post('/auth/registration')
                .send(preparedUser.valid2)
                .expect(204)

            const login2 = await request(server)
                .post('/auth/login')
                .send(preparedUser.login2)
                .set({ 'user-agent': 'chrome/0.1' })
                .expect(200)

            expect.setState({
                refreshToken1: (login1.headers['set-cookie'][0].split(';')[0]).slice(13),
                refreshToken2: (login2.headers['set-cookie'][0].split(';')[0]).slice(13)
            })
        })

        describe('Return all devises with active sessions for current user', () => {
            it('Shouldn`t return all device if refreshToken inside cookie is missing', async () => {
                await request(server)
                    .get(`/security/devices`)
                    .expect(401)
            })

            it('Shouldn`t return all device if refreshToken inside cookie is expired', async () => {
                const { refreshToken1 } = expect.getState()

                const expiredToken = await request(server)
                    .get(`/testing/expired-token/${refreshToken1}`)
                    .expect(200)

                await request(server)
                    .get(`/security/devices`)
                    .set('Cookie', `refreshToken=${expiredToken.body.expiredToken}`)
                    .expect(401)
            })

            it('Shouldn`t return all device if refreshToken inside cookie is incorrect', async () => {
                const { refreshToken1 } = expect.getState()

                await request(server)
                    .get(`/security/devices`)
                    .set('Cookie', `refreshToken=${refreshToken1}-1`)
                    .expect(401)
            })

            it('Return all devices current user', async () => {
                const { refreshToken1 } = expect.getState()

                const response = await request(server)
                    .get(`/security/devices`)
                    .set('Cookie', `refreshToken=${refreshToken1}`)
                    .expect(200)

                expect(response.body).toEqual(getAllDevices(3))

                expect.setState({deviceId: response.body[2].deviceId})
            })
        })

        describe('Terminate specified device session',  () => {
            it('Shouldn`t delete device if deviceId not found', async () => {
                const randomId = randomUUID()
                const { refreshToken1 } = expect.getState()

                await request(server)
                    .delete(`/security/devices/${randomId}`)
                    .set('Cookie', `refreshToken=${refreshToken1}`)
                    .expect(404)
            })

            it('Shouldn`t delete device if try to delete the deviceId of other user', async () => {
                const { refreshToken2, deviceId } = expect.getState()

                await request(server)
                    .delete(`/security/devices/${deviceId}`)
                    .set('Cookie', `refreshToken=${refreshToken2}`)
                    .expect(403)
            })

            it('Shouldn`t delete device if refresh token missing', async () => {
                const { refreshToken2 } = expect.getState()

                await request(server)
                    .delete(`/security/devices/${refreshToken2}`)
                    .expect(401)
            })

            it('Shouldn`t delete device if refresh token expired', async () => {
                const { refreshToken1, deviceId } = expect.getState()

                const expiredToken = await request(server)
                    .get(`/testing/expired-token/${refreshToken1}`)
                    .expect(200)

                await request(server)
                    .delete(`/security/devices/${deviceId}`)
                    .set('Cookie', `refreshToken=${expiredToken.body.expiredToken}`)
                    .expect(401)
            })

            it('Shouldn`t delete device if refresh token incorrect', async () => {
                const { refreshToken1, deviceId } = expect.getState()

                await request(server)
                    .delete(`/security/devices/${deviceId}`)
                    .set('Cookie', `refreshToken=${refreshToken1}-1`)
                    .expect(401)
            })

            it('Should delete device by id', async () => {
                const { refreshToken1, deviceId } = expect.getState()

                await request(server)
                    .delete(`/security/devices/${deviceId}`)
                    .set('Cookie', `refreshToken=${refreshToken1}`)
                    .expect(204)

                const response = await request(server)
                    .get(`/security/devices`)
                    .set('Cookie', `refreshToken=${refreshToken1}`)
                    .expect(200)

                expect(response.body).toHaveLength(2)
            })
        })

        describe('Terminate all other (exclude current) device`s session',  () => {
            it('Shouldn`t terminate all other device if refresh token missing', async () => {
                await request(server)
                    .delete(`/security/devices`)
                    .expect(401)
            })

            it('Shouldn`t terminate all other device  if refresh token expired', async () => {
                const { refreshToken1 } = expect.getState()

                const expiredToken = await request(server)
                    .get(`/testing/expired-token/${refreshToken1}`)
                    .expect(200)

                await request(server)
                    .delete(`/security/devices`)
                    .set('Cookie', `refreshToken=${expiredToken.body.expiredToken}`)
                    .expect(401)
            })

            it('Shouldn`t terminate all other device  if refresh token incorrect', async () => {
                const { refreshToken1 } = expect.getState()

                await request(server)
                    .delete(`/security/devices`)
                    .set('Cookie', `refreshToken=${refreshToken1}-1`)
                    .expect(401)
            })

            it('Shouldn`t terminate all other device', async () => {
                const { refreshToken1, refreshToken2 } = expect.getState()

                await request(server)
                    .delete(`/security/devices`)
                    .set('Cookie', `refreshToken=${refreshToken1}`)
                    .expect(204)

                const response1 = await request(server)
                    .get(`/security/devices`)
                    .set('Cookie', `refreshToken=${refreshToken1}`)
                    .expect(200)

                const response2 = await request(server)
                    .get(`/security/devices`)
                    .set('Cookie', `refreshToken=${refreshToken2}`)
                    .expect(200)

                expect(response1.body).toHaveLength(1)
                expect(response2.body).toHaveLength(1)
            })
        })
    })
})