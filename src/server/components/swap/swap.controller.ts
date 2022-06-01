import BaseApi from '../BaseApi';
import { Application, NextFunction, Request, Response } from 'express';
import * as responsehandler from '../../lib/response-handler';

export default class SwapController extends BaseApi {
    constructor(express: Application) {
        super();
        this.register(express);
    }

    public register(express: Application): void {
        express.use('/api/swap', this.router);
        this.router.get('/', this.getSwap);
    }

    public getSwap(req: Request, res: Response, next: NextFunction): void {
        try {
            const response = {
                stub: true,
            };
            res.locals.data = response;
            responsehandler.send(res);
        } catch (err) {
            next(err);
        }
    }
}
