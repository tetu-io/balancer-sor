import * as express from 'express';
import VersionController from './components/version/version.controller';
import SwapController from './components/swap/swap.controller';
import DexController from './components/dexes/dex.controller';

export default function registerRouter(app: express.Application): void {
    new VersionController(app);
    new SwapController(app);
    new DexController(app);
}
