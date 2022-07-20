// TS_NODE_PROJECT='tsconfig.testing.json' npx mocha -r ts-node/register test/math.spec.ts

import dotenv from 'dotenv'; // for INFURA=key
dotenv.config();

import { expect } from 'chai';
import dystPairAbi from '../src/pools/dystopiaStablePool/DystPair.json';
import dystFactorAbi from '../src/pools/dystopiaStablePool/DystFactory.json';
import ERC20Abi from '../test/abi/ERC20.json';
import { Contract } from '@ethersproject/contracts';
import { Network, PROVIDER_URLS } from './testScripts/constants';
import { JsonRpcProvider } from '@ethersproject/providers';
import { _calcOutGivenIn } from '../src/pools/dystopiaStablePool/dystopiaMath';
import { _calcOutGivenIn as _calcOutGivenInUniswap } from '../src/pools/uniswapV2Pool/uniswapV2Math';
import { parseFixed } from '@ethersproject/bignumber';
import { SWAP_FEE_FACTOR } from '../src/pools/dystopiaStablePool/dystopia-stable-pool';

const _MAX_PAIRS_TO_TEST = 30;

describe('dystopiaMath tests', function () {
    this.timeout(30000);
    context('spot prices', async () => {
        const networkId = Network.POLYGON;
        const provider = new JsonRpcProvider(PROVIDER_URLS[networkId]);

        const dystFactoryAddress = '0x1d21Db6cde1b18c7E47B0F7F42f4b3F68b9beeC9';
        const factoryContract = new Contract(
            dystFactoryAddress,
            dystFactorAbi,
            provider
        );

        it('dystopia _calcOutGivenIn', async () => {
            const pairsLength = await factoryContract.allPairsLength();
            console.log('pairsLength', pairsLength.toString());
            let maxDeviation = 0;

            const startPair = 1;
            const lastPair = Math.min(pairsLength, _MAX_PAIRS_TO_TEST);
            for (let i = startPair; i < lastPair; i++) {
                const dystPairAddress = await factoryContract.allPairs(i);
                console.log(i, 'dystPairAddress', dystPairAddress);

                const pairContract = new Contract(
                    dystPairAddress,
                    dystPairAbi,
                    provider
                );

                const stable = await pairContract.stable();
                console.log('stable', stable);

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

                const amount = parseFixed('1', decimalsIn);
                console.log('amount', amount.toString());

                const r = await pairContract.getReserves();
                console.log('reserves', r[0].toString(), r[1].toString());

                const minReserve = 1000000;
                if (
                    r[0].div(4).lt(amount) ||
                    r[0].lt(minReserve) ||
                    r[1].lt(minReserve)
                ) {
                    console.log('Reserves to low. Skipping...');
                    continue;
                }

                const outOnchain = BigInt(
                    await pairContract.getAmountOut(amount, token0)
                );
                console.log('outOnchain ', outOnchain);

                const fee = 1000000000000000000n / SWAP_FEE_FACTOR; // SOR uses 18 fixed points fee / ratio
                const outOffchain = stable
                    ? _calcOutGivenIn(
                          r[0].toBigInt(),
                          r[1].toBigInt(),
                          amount.toBigInt(),
                          fee,
                          decimalsIn,
                          decimalsOut
                      )
                    : _calcOutGivenInUniswap(
                          r[0].toBigInt(),
                          r[1].toBigInt(),
                          amount.toBigInt(),
                          fee
                      );
                console.log('outOffchain', outOffchain);
                const deviation = 1 - Number(outOffchain) / Number(outOnchain);
                console.log('deviation', (deviation * 100).toFixed(6), '%');
                console.log('-----------------------------');

                maxDeviation = Math.max(maxDeviation, deviation);
            }
            expect(maxDeviation).lt(0.00001, 'Deviation too big');
        }).timeout(10000000);
    });
});
