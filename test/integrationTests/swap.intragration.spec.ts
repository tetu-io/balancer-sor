import 'jest';
import * as express from 'express';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import IntegrationHelpers from '../integrationTests/helper/integration.helper';

describe('swap integration tests', () => {
    let app: express.Application;
    beforeAll(async () => {
        app = await IntegrationHelpers.getApp();
    });

    it('can get swap equals stub', async () => {
        await request(app)
            .get('/api/swap')
            .set('Accept', 'application/json')
            .expect({
                stub: true,
            })
            .expect(StatusCodes.OK);
    });
});
