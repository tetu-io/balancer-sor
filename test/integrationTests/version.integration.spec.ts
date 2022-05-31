import 'jest';
import * as express from 'express';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import IntegrationHelpers from '../integrationTests/helper/integration.helper';

describe('version integration tests', () => {
    let app: express.Application;
    beforeAll(async () => {
        app = await IntegrationHelpers.getApp();
    });

    it('can get version equals 1.0.0', async () => {
        await request(app)
            .get('/api/version')
            .set('Accept', 'application/json')
            .expect({
                version: '1.0.0',
            })
            .expect(StatusCodes.OK);
    });
});
