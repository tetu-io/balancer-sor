// TS_NODE_PROJECT='tsconfig.testing.json' npx mocha -r ts-node/register test/math.spec.ts

import dotenv from 'dotenv'; // for INFURA=key
import maticTokens from './testData/maticTokens.json';
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
import { testTokens } from './api-test-data';
import { parseFixed } from '@ethersproject/bignumber';

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
    this.timeout(12000000);
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
        const amount = '0';
        const swap = await api.getSwap(
            sor,
            testTokens.USDC,
            testTokens.WMATIC,
            amount,
            []
        );
        // console.log('swap', swap);

        expect(swap.swaps.length).eq(0, 'swaps length must be 0');
        expect(swap.tokenAddresses.length).eq(
            0,
            'token addresses (assets) length must be 0'
        );

        expect(swap.tokenIn).eq('');
        expect(swap.tokenOut).eq('');
    });

    const tokensToTest = [
        '0x0000000000000000000000000000000000000000'.toLowerCase(),
        '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'.toLowerCase(),
        '0xc3FdbadC7c795EF1D6Ba111e06fF8F16A20Ea539'.toLowerCase(),
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'.toLowerCase(),
        '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'.toLowerCase(),
        '0x831753DD7087CaC61aB5644b308642cc1c33Dc13'.toLowerCase(),
        '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a'.toLowerCase(),
        '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'.toLowerCase(),
        '0xFbdd194376de19a88118e84E279b977f165d01b8'.toLowerCase(),
        '0x0361BdEAB89DF6BBcc52c43589FABba5143d19dD'.toLowerCase(),
        '0x7f426F6Dc648e50464a0392E60E1BB465a67E9cf'.toLowerCase(),
        '0x8C92e38eCA8210f4fcBf17F0951b198Dd7668292'.toLowerCase(),
        '0xEde1B77C0Ccc45BFa949636757cd2cA7eF30137F'.toLowerCase(),
        '0x5fe2B58c013d7601147DcdD68C143A77499f5531'.toLowerCase(),
        '0x104592a158490a9228070E0A8e5343B499e125D0'.toLowerCase(),
        '0x3e121107F6F22DA4911079845a470757aF4e1A1b'.toLowerCase(),
        '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'.toLowerCase(),
        '0x172370d5Cd63279eFa6d502DAB29171933a610AF'.toLowerCase(),
        '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'.toLowerCase(),
        '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39'.toLowerCase(),
        '0xD6DF932A45C0f255f85145f286eA0b292B21C90B'.toLowerCase(),
        '0xD0660cD418a64a1d44E9214ad8e459324D8157f1'.toLowerCase(),
        '0x4EaC4c4e9050464067D673102F8E24b2FccEB350'.toLowerCase(),
        '0x50B728D8D964fd00C2d0AAD81718b71311feF68a'.toLowerCase(),
        '0x6aB6d61428fde76768D7b45D8BFeec19c6eF91A8'.toLowerCase(),
        '0x99dA82C5464C49962Cdda44fe30d352Bc5Da0580'.toLowerCase(),
        '0x580A84C73811E1839F75d86d75d88cCa0c241fF4'.toLowerCase(),
        '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1'.toLowerCase(),
        '0x4c4BF319237D98a30A929A96112EfFa8DA3510EB'.toLowerCase(),
        '0xc8bcb58caEf1bE972C0B638B1dD8B0748Fdc8A44'.toLowerCase(),
        '0x4A81f8796e0c6Ad4877A51C86693B0dE8093F2ef'.toLowerCase(), // iron ice
        '0xa5Eb60CA85898f8b26e18fF7c7E43623ccbA772C'.toLowerCase(),
        '0xaa9654becca45b5bdfa5ac646c939c62b527d394'.toLowerCase(),
        '0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171'.toLowerCase(),
        '0xf8a57c1d3b9629b77b6726a042ca48990A84Fb49'.toLowerCase(),
        '0xdAD97F7713Ae9437fa9249920eC8507e5FbB23d3'.toLowerCase(),
        '0xdaB35042e63E93Cc8556c9bAE482E5415B5Ac4B1'.toLowerCase(), // Hermes
        '0xc168e40227e4ebd8c1cae80f7a55a4f0e6d66c97'.toLowerCase(),
        '0xb5106A3277718eCaD2F20aB6b86Ce0Fee7A21F09'.toLowerCase(),
        '0xacee7bd17e7b04f7e48b29c0c91af67758394f0f'.toLowerCase(),
        '0x225084D30cc297F3b177d9f93f5C3Ab8fb6a1454'.toLowerCase(),
        '0xf28164A485B0B2C90639E47b0f377b4a438a16B1'.toLowerCase(),
        '0xD86b5923F3AD7b585eD81B448170ae026c65ae9a'.toLowerCase(),
        '0x5c2ed810328349100A66B82b78a1791B101C9D61'.toLowerCase(),
        '0x8A953CfE442c5E8855cc6c61b1293FA648BAE472'.toLowerCase(),
        '0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3'.toLowerCase(),
        '0xab0b2ddB9C7e440fAc8E140A89c0dbCBf2d7Bbff'.toLowerCase(),
        '0x4e78011ce80ee02d2c3e649fb657e45898257815'.toLowerCase(),
        '0x2F800Db0fdb5223b3C3f354886d907A671414A7F'.toLowerCase(),
        '0x42d61D766B85431666B39B89C43011f24451bFf6'.toLowerCase(),
        '0x29F1e986FCa02B7E54138c04C4F503DdDD250558'.toLowerCase(),
        '0xdf9B4b57865B403e08c85568442f95c26b7896b0'.toLowerCase(),
        '0xcD86152047e800d67BDf00A4c635A8B6C0e5C4c2'.toLowerCase(),
        '0x948D0a28b600BDBd77AF4ea30E6F338167034181'.toLowerCase(),
        '0xfc4a30f328E946ef3E727BD294a93e84c2e43c24'.toLowerCase(),
        '0xc46DB78Be28B5F2461097ed9e3Fcc92E9FF8676d'.toLowerCase(),
        '0x3066818837c5e6eD6601bd5a91B0762877A6B731'.toLowerCase(),
        '0xc250e9987a032acac293d838726c511e6e1c029d'.toLowerCase(),
        '0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683'.toLowerCase(),
        '0x39aB6574c289c3Ae4d88500eEc792AB5B947A5Eb'.toLowerCase(),
        '0x236eeC6359fb44CCe8f97E99387aa7F8cd5cdE1f'.toLowerCase(), // USD+
        '0x255707B70BF90aa112006E1b07B9AeA6De021424'.toLowerCase(), // TETU
        '0x62F594339830b90AE4C084aE7D223fFAFd9658A7'.toLowerCase(), // DYST
    ];

    interface ISwapPair {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tokenIn: any;
        tokenOut: any;
    }

    it.skip('many swaps', async function () {
        const tokens = maticTokens.filter((t) =>
            tokensToTest.includes(t.address.toLowerCase())
        );
        console.log('tokens.length', tokens.length);
        let n = 0;
        const notFound: ISwapPair[] = [];

        const tokensIn = tokens; //.slice(1, 2);
        const tokensOut = tokens; //.slice(25, 30);
        const total = tokensIn.length * tokensOut.length;

        // const tokensIn = [tokens.find(t => t.symbol === 'AAVE')];
        // const tokensOut = [tokens.find(t => t.symbol === 'DAI')];

        for (const tokenIn of tokensIn) {
            if (!tokenIn) continue;
            const amount = parseFixed('0.1', tokenIn.decimals);
            for (const tokenOut of tokensOut) {
                if (!tokenOut) continue;
                n++;
                if (tokenIn == tokenOut) continue;
                console.log(
                    ((n / total) * 100).toFixed(1),
                    '%',
                    tokenIn.symbol,
                    '=>',
                    tokenOut.symbol,
                    '                 '
                );

                const swap = await api.getSwap(
                    sor,
                    tokenIn,
                    tokenOut,
                    amount,
                    []
                );
                // if(swap.swaps.length) console.log('swap', swap);
                if (swap.swaps.length === 0) {
                    notFound.push({ tokenIn, tokenOut });
                    console.log('  notFound.length', notFound.length);
                    continue;
                }

                expect(swap.tokenIn).eq(tokenIn.address.toLowerCase());
                expect(swap.tokenOut).eq(tokenOut.address.toLowerCase());
                expect(swap.swapAmount.toString()).eq(amount.toString());

                expect(swap.swaps.length).gt(0, 'swaps length must be > 0');
                expect(swap.tokenAddresses.length).gte(
                    2,
                    'token addresses (assets) length must be 2 or more'
                );
                // expect(swap.returnAmount.toString()).not.eq('0', 'returnAmount must be > 0');
            }
        }
        const notFoundPercentage = ((notFound.length / total) * 100).toFixed(2);
        console.log('total             ', total);
        console.log('notFound.length   ', notFound.length);
        console.log('notFoundPercentage', notFoundPercentage);
    });
});
