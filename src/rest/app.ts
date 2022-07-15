import compression from 'compression';
import express from 'express';
import cors from 'cors';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import {
    BALANCER_SUBGRAPH_URLS,
    CONTRACT_UTILS,
    DYSTOPIA_SUBGRAPH_URLS,
    MULTIADDR,
    Network,
    PROVIDER_URLS,
    SOR_CONFIG,
    UNISWAP_SUBGRAPHS,
} from '../../test/api/config';
import { JsonRpcProvider } from '@ethersproject/providers';
import * as api from '../../test/api/api';
import { BigNumber } from '@ethersproject/bignumber';
const app = express();

Sentry.init({
    dsn: 'https://2874e5f5af684388851e388268273345@o1270885.ingest.sentry.io/6462171',
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Tracing.Integrations.Express({ app }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});

app.use(cors());
app.use(compression());
// noinspection TypeScriptValidateJSTypes
app.use(Sentry.Handlers.requestHandler());
// noinspection TypeScriptValidateJSTypes
app.use(Sentry.Handlers.tracingHandler());

// noinspection TypeScriptValidateJSTypes
app.use('/demo', express.static('demo'));

const port = process.env.SOR_PORT || 8080;
const API_VERSION = '1.1.0';

const networkId = Network.POLYGON;
let sor;
let provider;
let tokens;
let dexes;

// ------------ ROOT --------------
app.all('/', (req, res) => {
    res.redirect('/demo');
});

// ------------ INFO --------------
app.all('/info', (req, res) => {
    res.json({
        title: 'SOR (Smart Order Router)',
        version: API_VERSION,
    });
});

const _SERVER_NOT_READY = 'Error: Server not ready';

// ------------ DEXES --------------
app.all('/dexes', (req, res) => {
    if (dexes) res.json(dexes);
    else res.status(400).send(_SERVER_NOT_READY);
});

// ------------ TOKENS --------------
app.all('/tokens', (req, res) => {
    if (tokens) res.json(tokens);
    else res.status(400).send(_SERVER_NOT_READY);
});

// ------------ SWAP --------------
app.all('/swap', async (req, res) => {
    if (!sor) res.status(400).send(_SERVER_NOT_READY);
    else
        try {
            const query = req.query;
            const swapRequest = JSON.parse(query.swapRequest);

            const swapInfo = await api.getSwap(
                sor,
                swapRequest.tokenIn,
                swapRequest.tokenOut,
                swapRequest.swapAmount,
                swapRequest.excludePlatforms
            );
            res.json(swapInfo);
        } catch (e) {
            console.error(e);
            res.status(400).send('Error:' + e);
        }
});

app.listen(port, async () => {
    console.log(`Listening on port ${port}`);
});

// noinspection TypeScriptValidateJSTypes
app.use(Sentry.Handlers.errorHandler());

// for proper BigNumber serialization (toString)
Object.defineProperties(BigNumber.prototype, {
    toJSON: {
        value: function (this: BigNumber) {
            return this.toString();
        },
    },
});

async function initialize() {
    console.log(`SOR (Smart Order Router) v${API_VERSION}`);
    provider = new JsonRpcProvider(PROVIDER_URLS[networkId]);

    sor = await api.init(
        networkId,
        provider,
        MULTIADDR[networkId],
        SOR_CONFIG[networkId],
        BALANCER_SUBGRAPH_URLS[networkId],
        DYSTOPIA_SUBGRAPH_URLS[networkId],
        UNISWAP_SUBGRAPHS[networkId]
    );
    dexes = api.getDexes(sor); // cache dexes

    if (!process.env.MULTISWAP_NO_UPDATE) {
        setInterval(updatePools, 60 * 1000);
        setInterval(updateTokens, 30 * 60 * 1000);
    }

    await updateTokens();

    console.log(`\nReady.`);
}
initialize().then();

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function updatePools() {
    console.time('fetchPools');
    console.log(new Date().toLocaleTimeString(), 'fetchPools...');
    if (sor) {
        let fetched;
        do {
            fetched = await sor.fetchPools();
            if (!fetched) await sleep(1000);
        } while (!fetched);
    }
    console.timeEnd('fetchPools');
}

async function updateTokens() {
    console.time('updateTokens');
    console.log(new Date().toLocaleTimeString(), 'updateTokens...');
    if (sor) tokens = await api.getTokens(sor, CONTRACT_UTILS[networkId]);
    console.timeEnd('updateTokens');
}
