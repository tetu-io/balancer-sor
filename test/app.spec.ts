// TS_NODE_PROJECT='tsconfig.testing.json' npx mocha -r ts-node/register test/math.spec.ts
/*

RUN SERVER FIRST
npm run start (*nix)
npm run dev (win)

*/
import dotenv from 'dotenv'; // for INFURA=key
dotenv.config();

import { expect } from 'chai';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { testTokens } from './api-test-data';
import { wait } from '../src/utils/tools';

describe.skip('Express APP tests', function () {
    this.timeout(12000000);
    const appUrl = 'http://localhost:8080/';
    console.log('Server url:', appUrl);

    before(async function () {
        console.log('Waiting when server ready...');
        let response,
            serverReady = false,
            firstCheck = true;
        let tries = 0;
        do {
            tries++;
            console.log(tries, '\x1B[F');
            if (!firstCheck) await wait(2000);
            firstCheck = false;
            try {
                response = await fetch(appUrl + 'info');
            } catch (e) {
                continue;
            }
            if (response.status !== 200) continue;
            const json = await response.json();
            serverReady = json.serverReady;
        } while (!serverReady);
        console.log('Starting tests...');
    });

    it('/info', async function () {
        const response = await fetch(appUrl + 'info');
        expect(response.status).to.equal(200);

        const json = await response.json();
        console.log('json', json);
        expect(json.title).to.equal('SOR (Smart Order Router)');
    });

    it('/dexes', async function () {
        const response = await fetch(appUrl + 'dexes');
        expect(response.status).to.equal(200);

        const dexes = await response.json();
        const dex0 = dexes[0];
        expect(dex0.name).eq('Balancer', 'Wrong main dex name');
        expect(dex0.dexType).eq('Balancer', 'Wrong main dex type');
        expect(dex0.mask).eq(undefined, 'Main dex mask must be undefined');
        expect(dex0.dexId).eq(undefined, 'Main dex dexId must be undefined');
    });

    it('/tokens', async function () {
        const response = await fetch(appUrl + 'tokens');
        expect(response.status).to.equal(200);

        const tokens = await response.json();
        const tokenKeys = Object.keys(tokens);
        console.log('tokenKeys.length', tokenKeys.length);
        expect(tokenKeys.length).gt(2500, 'Tokens length too small');

        for (const testTokenKey of Object.keys(testTokens)) {
            console.log('testTokenKey', testTokenKey);
            const testToken = testTokens[testTokenKey];
            const token = tokens[testToken.address];

            expect(token.address).eq(testToken.address, 'Wrong token address');
            expect(token.symbol).eq(testToken.symbol, 'Wrong token symbol');
            expect(token.decimals).eq(
                testToken.decimals.toString(),
                'Wrong token decimals'
            );
        }
    });

    it('/swap', async function () {
        const amount = '1000000'; // 1 USD

        const query = {
            tokenIn: testTokens.USDC,
            tokenOut: testTokens.WMATIC,
            swapAmount: amount,
            excludePlatforms: [],
        };

        const url =
            appUrl +
            'swap?' +
            new URLSearchParams({
                swapRequest: JSON.stringify(query),
            });

        const response = await fetch(url);
        expect(response.status).to.equal(200);

        const swap = await response.json();
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

    it('/swap (no route)', async function () {
        const amount = '0'; // to test no route

        const query = {
            tokenIn: testTokens.USDC,
            tokenOut: testTokens.WMATIC,
            swapAmount: amount,
            excludePlatforms: [],
        };

        const url =
            appUrl +
            'swap?' +
            new URLSearchParams({
                swapRequest: JSON.stringify(query),
            });

        const response = await fetch(url);
        expect(response.status).to.equal(200);

        const swap = await response.json();
        console.log('swap', swap);

        expect(swap.swaps.length).eq(0, 'swaps length must be 0');
        expect(swap.tokenAddresses.length).eq(
            0,
            'token addresses (assets) length must be 0'
        );

        expect(swap.tokenIn).eq('');
        expect(swap.tokenOut).eq('');
    });
});
