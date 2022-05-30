import express from 'express';
import {
    BALANCER_SUBGRAPH_URLS,
    MULTIADDR,
    Network,
    PROVIDER_URLS,
    SOR_CONFIG,
    UNISWAP_SUBGRAPHS,
} from '../../test/api/config';
import { BigNumber, parseFixed } from '@ethersproject/bignumber';
import { swapExample } from '../../test/testScripts/swapExampleTetu';
import { SorConfig } from '../../dist';
import { ITokenData } from '../../test/api/api';
import { JsonRpcProvider } from '@ethersproject/providers';
import * as multiswapApi from '../../test/api/api';
const app = express();
const port = process.env.SOR_PORT || 8080;
const VERSION = '1.0.0';

const networkId = Network.POLYGON;
let sor;
let provider;

app.all('/', (req, res) => {
    res.send({
        title: 'SOR (Smart Order Router)',
        version: VERSION,
    });
});

app.all('/dexes', (req, res) => {
    // TODO sentry
    res.send(multiswapApi.getDexes(sor));
});

app.all('/swap', async (req, res) => {
    // TODO sentry
    console.log('getSwap', req);
    const swapInfo = await multiswapApi.getSwap(
        sor,
        req.tokenIn,
        req.tokenOut,
        req.swapAmount
    );

    res.send(swapInfo);
});

app.listen(port, async () => {
    // TODO sentry

    console.log(
        `SOR (Smart Order Router) v${VERSION} listening on port ${port}`
    );

    provider = new JsonRpcProvider(PROVIDER_URLS[networkId]);

    sor = await multiswapApi.init(
        networkId,
        provider,
        MULTIADDR[networkId],
        SOR_CONFIG[networkId],
        BALANCER_SUBGRAPH_URLS[networkId],
        UNISWAP_SUBGRAPHS[networkId]
    );

    setInterval(updatePools, 30 * 1000);
});

async function updatePools() {
    console.time('updatePools');
    console.log(new Date().toLocaleTimeString(), 'fetchPools...');
    if (sor) await sor.fetchPools();
    console.timeEnd('updatePools');
}
