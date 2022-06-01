import compression from 'compression';
import express from 'express';
import {
    BALANCER_SUBGRAPH_URLS,
    CONTRACT_UTILS,
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
import * as api from '../../test/api/api';
const app = express();
app.use(compression());
const port = process.env.SOR_PORT || 8080;
const VERSION = '1.0.0';

const networkId = Network.POLYGON;
let sor;
let provider;
let tokens;
let dexes;

app.all('/', (req, res) => {
    console.log('/');
    res.json({
        title: 'SOR (Smart Order Router)',
        version: VERSION,
    });
});

app.all('/dexes', (req, res) => {
    console.log('/dexes');
    // TODO sentry
    res.json(dexes);
});

app.all('/tokens', (req, res) => {
    // TODO sentry
    console.log('/tokens');
    res.json(tokens);
});

app.all('/swap', async (req, res) => {
    // TODO sentry
    const query = req.query;
    console.log('/swap', query);

    // TODO add more checks (token fields, amount)
    if (!(query.tokenIn && query.tokenOut && query.swapAmount)) {
        res.status(400).send('Error: Wrong query fields');
        return;
    }

    try {
        const swapInfo = await api.getSwap(
            sor,
            query.tokenIn,
            query.tokenOut,
            query.swapAmount
        );

        res.json(swapInfo);
    } catch (e) {
        res.status(400).send('Error:' + e);
    }
});

app.listen(port, async () => {
    // TODO sentry

    console.log(`SOR (Smart Order Router) v${VERSION}`);

    provider = new JsonRpcProvider(PROVIDER_URLS[networkId]);

    sor = await api.init(
        networkId,
        provider,
        MULTIADDR[networkId],
        SOR_CONFIG[networkId],
        BALANCER_SUBGRAPH_URLS[networkId],
        UNISWAP_SUBGRAPHS[networkId]
    );
    dexes = api.getDexes(sor); // cache dexes

    await updateTokens();

    setInterval(updatePools, 30 * 1000);
    setInterval(updateTokens, 10 * 60 * 1000);

    console.log(`\nReady.\nListening on port ${port}`);
});

async function updatePools() {
    console.time('fetchPools');
    console.log(new Date().toLocaleTimeString(), 'fetchPools...');
    if (sor) await sor.fetchPools();
    console.timeEnd('fetchPools');
}

async function updateTokens() {
    console.time('updateTokens');
    console.log(new Date().toLocaleTimeString(), 'updateTokens...');
    if (sor) tokens = await api.getTokens(sor, CONTRACT_UTILS[networkId]);
    console.timeEnd('updateTokens');
}
