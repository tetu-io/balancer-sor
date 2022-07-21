// TS_NODE_PROJECT='tsconfig.testing.json' npx mocha -r ts-node/register test/math.spec.ts

import dotenv from 'dotenv'; // for INFURA=key
dotenv.config();

import { expect } from 'chai';
import * as api from './api/api';
import {
    BALANCER_SUBGRAPH_URLS,
    CONTRACT_UTILS,
    DYSTOPIA_SUBGRAPH_URLS,
    MULTIADDR,
    Network,
    PROVIDER_URLS,
    SOR_CONFIG,
    UNISWAP_SUBGRAPHS,
} from './api/config';
import { JsonRpcProvider } from '@ethersproject/providers';

const testTokens = {
    WMATIC: {
        address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        decimals: 18,
        symbol: 'WMATIC',
    },
    USDC: {
        address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        decimals: 6,
        symbol: 'USDC',
    },
};

const networkId = Network.POLYGON;
let sor;
let provider;

const initAPI = async function () {
    return api.init(
        networkId,
        provider,
        MULTIADDR[networkId],
        SOR_CONFIG[networkId],
        BALANCER_SUBGRAPH_URLS[networkId],
        DYSTOPIA_SUBGRAPH_URLS[networkId],
        UNISWAP_SUBGRAPHS[networkId]
    );
};

describe('API tests', function () {
    this.timeout(120000);
    provider = new JsonRpcProvider(PROVIDER_URLS[networkId]);

    before(async function () {
        sor = await initAPI();
    });

    it('dexes', async function () {
        const dexes = api.getDexes(sor);
        // console.log('dexes', dexes);
        console.log('dexes.length', dexes.length);
        expect(dexes.length).eq(11, 'Wrong dexes length');

        const dex0 = dexes[0];
        expect(dex0.name).eq('Balancer', 'Wrong main dex name');
        expect(dex0.dexType).eq('Balancer', 'Wrong main dex type');
        expect(dex0.mask).eq(undefined, 'Main dex mask must be undefined');
        expect(dex0.dexId).eq(undefined, 'Main dex dexId must be undefined');
    });

    it('tokens', async function () {
        const tokens = await api.getTokens(sor, CONTRACT_UTILS[networkId]);
        const tokenKeys = Object.keys(tokens);
        console.log('tokens[tokenKeys[0]]', tokens[tokenKeys[0]]);
        console.log('tokenKeys.length', tokenKeys.length);
        expect(tokenKeys.length).gt(2500, 'Tokens length too small');

        for (const testTokenKey of Object.keys(testTokens)) {
            console.log('testTokenKey', testTokenKey);
            const testToken = testTokens[testTokenKey];
            console.log('testToken', testToken);
            const token = tokens[testToken.address];

            expect(token.address).eq(testToken.address, 'Wrong token address');
            expect(token.symbol).eq(testToken.symbol, 'Wrong token symbol');
            expect(token.decimals).eq(
                testToken.decimals.toString(),
                'Wrong token decimals'
            );
        }
    });

    it('swap', async function () {
        const amount = '1000000'; // 1 USD
        const swap = await api.getSwap(
            sor,
            testTokens.USDC,
            testTokens.WMATIC,
            amount,
            []
        );
        console.log('swap', swap);

        expect(swap.tokenIn).eq(testTokens.USDC.address);
        expect(swap.tokenOut).eq(testTokens.WMATIC.address);
        expect(swap.swapAmount.toString()).eq(amount);

        expect(swap.swaps.length).gt(0, 'swaps length must be > 0');
        expect(swap.tokenAddresses.length).gte(
            2,
            'token addresses (assets) length must be 2 or more'
        );
        expect(swap.returnAmount.toString()).not.eq(
            '0',
            'returnAmount must be > 0'
        );
    });

    it('swap (no route)', async function () {
        const amount = '0'; // 1 USD
        const swap = await api.getSwap(
            sor,
            testTokens.USDC,
            testTokens.WMATIC,
            amount,
            []
        );
        console.log('swap', swap);

        expect(swap.tokenIn).eq('');
        expect(swap.tokenOut).eq('');
        expect(swap.swapAmount.toString()).eq(amount);

        expect(swap.swaps.length).eq(0, 'swaps length must be 0');
        expect(swap.tokenAddresses.length).eq(
            0,
            'token addresses (assets) length must be 0'
        );
        expect(swap.returnAmount.toString()).eq('0', 'returnAmount must be 0');
    });
});
