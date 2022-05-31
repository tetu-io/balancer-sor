import BaseApi from '../BaseApi';
import { Application, NextFunction, Request, Response } from 'express';
import * as responsehandler from '../../lib/response-handler';

export default class VersionController extends BaseApi {
    constructor(express: Application) {
        super();
        this.register(express);
    }

    public register(express: Application): void {
        express.use('/api/version', this.router);
        this.router.get('/', this.getVersion);
    }

    public getVersion(req: Request, res: Response, next: NextFunction): void {
        try {
            const response = {
                version: '1.0.0',
            };
            res.locals.data = response;
            responsehandler.send(res);
        } catch (err) {
            next(err);
        }
    }
}
