import 'jest';
import * as express from 'express';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import IntegrationHelpers from '../integrationTests/helper/integration.helper';

describe('dex integration tests', () => {
    let app: express.Application;
    beforeAll(async () => {
        app = await IntegrationHelpers.getApp();
    });

    it('can get dexes equals stub', async () => {
        await request(app)
            .get('/api/dexes')
            .set('Accept', 'application/json')
            .expect({
                stub: true,
            })
            .expect(StatusCodes.OK);
    });
});
