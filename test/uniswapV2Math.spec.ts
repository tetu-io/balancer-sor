// TS_NODE_PROJECT='tsconfig.testing.json' npx mocha -r ts-node/register test/math.spec.ts

import dotenv from 'dotenv'; // for INFURA=key
dotenv.config();

import { expect } from 'chai';
import pairAbi from '../src/pools/uniswapV2Pool/uniswapV2PoolAbi.json';
import factoryAbi from '../src/pools/uniswapV2Pool/uniswapV2FactoryAbi.json';
import routerAbi from '../src/pools/uniswapV2Pool/uniswapV2RouterAbi.json';
import ERC20Abi from '../test/abi/ERC20.json';
import { Contract } from '@ethersproject/contracts';
import { Network, PROVIDER_URLS } from './testScripts/constants';
import { JsonRpcProvider } from '@ethersproject/providers';
import {
    _calcInGivenOut,
    _calcOutGivenIn,
} from '../src/pools/uniswapV2Pool/uniswapV2Math';
import { parseFixed } from '@ethersproject/bignumber';

const _MAX_PAIRS_TO_TEST = 20;

describe('uniswapV2Math tests', function () {
    this.timeout(30000);
    context('spot prices', async () => {
        const networkId = Network.POLYGON;
        const provider = new JsonRpcProvider(PROVIDER_URLS[networkId]);

        const factoryAddress = '0xc35dadb65012ec5796536bd9864ed8773abc74c4'; // sushiswap
        const factoryContract = new Contract(
            factoryAddress,
            factoryAbi,
            provider
        );

        const routerAddress = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'; // sushiswap
        const routerContract = new Contract(routerAddress, routerAbi, provider);

        it('uniswapV2 _calcOutGivenIn / _calcInGivenOut', async () => {
            const pairsLength = await factoryContract.allPairsLength();
            console.log('pairsLength', pairsLength.toString());
            let maxDeviation = 0;

            const startPair = 1;
            const lastPair = Math.min(pairsLength, _MAX_PAIRS_TO_TEST);
            for (let i = startPair; i < lastPair; i++) {
                // const pairsToCheck = [47, 66];
                // for (const i of pairsToCheck) {

                const pairAddress = await factoryContract.allPairs(i);
                console.log(i, 'pairAddress', pairAddress);

                const pairContract = new Contract(
                    pairAddress,
                    pairAbi,
                    provider
                );

                const token0 = await pairContract.token0();
                console.log('token0', token0);
                const token0Contract = new Contract(token0, ERC20Abi, provider);
                const decimalsIn = await token0Contract.decimals();
                console.log('decimalsIn', decimalsIn);

                const token1 = await pairContract.token1();
                console.log('token1', token1);
                const token1Contract = new Contract(token1, ERC20Abi, provider);
                const decimalsOut = await token1Contract.decimals();
                console.log('decimalsOut', decimalsOut);

                let amount = parseFixed('1', decimalsIn);
                console.log('amount', amount.toString());

                const r = await pairContract.getReserves();
                console.log('reserves', r[0].toString(), r[1].toString());

                const minReserve = 1000000;
                if (
                    r[0].div(5).lt(amount) ||
                    r[0].lt(minReserve) ||
                    r[1].lt(minReserve)
                ) {
                    console.log('Reserves to low. Skipping...');
                    continue;
                }

                const fee = (1000000000000000000n * 3n) / 1000n; // SOR uses 18 fixed points math fee / ratio

                const outOffchain = _calcOutGivenIn(
                    r[0].toBigInt(),
                    r[1].toBigInt(),
                    amount.toBigInt(),
                    fee
                );
                console.log('outOffchain', outOffchain);

                const outOnchain = BigInt(
                    await routerContract.getAmountOut(amount, r[0], r[1])
                );
                console.log('outOnchain ', outOnchain);

                const deviation = 1 - Number(outOffchain) / Number(outOnchain);
                console.log('deviation  ', (deviation * 100).toFixed(6), '%');

                console.log('- - - - - - - - - - - - - - -');

                amount = parseFixed('1', decimalsOut);
                console.log('amount', amount.toString());

                if (r[1].div(5).lt(amount)) {
                    console.log('Reserves to low. Skipping...');
                    continue;
                }

                // BUY side (_calcInGivenOut / getAmountIn)
                const outOffchain2 = _calcInGivenOut(
                    r[0].toBigInt(),
                    r[1].toBigInt(),
                    amount.toBigInt(),
                    fee
                );
                console.log('outOffchain2', outOffchain2);

                const outOnchain2 = BigInt(
                    await routerContract.getAmountIn(amount, r[0], r[1])
                );
                console.log('outOnchain2 ', outOnchain2);

                const deviation2 = 1 - Number(outOffchain) / Number(outOnchain);
                console.log('deviation2  ', (deviation2 * 100).toFixed(6), '%');
                console.log('-----------------------------');

                maxDeviation = Math.max(maxDeviation, deviation);
            }
            expect(maxDeviation).lt(0.00001, 'Deviation too big');
        }).timeout(10000000);
    });
});
