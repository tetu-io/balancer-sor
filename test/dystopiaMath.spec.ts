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
import { parseFixed } from '@ethersproject/bignumber';
import { SWAP_FEE_FACTOR } from '../src/pools/dystopiaStablePool/dystopia-stable-pool';

describe('dystStableMath tests', function () {
    this.timeout(20000);
    context('spot prices', async () => {
        const networkId = Network.POLYGON;
        const provider = new JsonRpcProvider(PROVIDER_URLS[networkId]);

        const dystFactoryAddress = '0x1d21Db6cde1b18c7E47B0F7F42f4b3F68b9beeC9';
        const factoryContract = new Contract(
            dystFactoryAddress,
            dystFactorAbi,
            provider
        );

        const dystStablePairAddress =
            '0x421a018cc5839c4c0300afb21c725776dc389b1a'; // https://info.dystopia.exchange/pair/0x421a018cc5839c4c0300afb21c725776dc389b1a
        const pairContract = new Contract(
            dystStablePairAddress,
            dystPairAbi,
            provider
        );

        it('dystStable symbol check', async () => {
            const symbol = await pairContract.symbol();
            console.log('symbol', symbol);
            expect(symbol).is.eq('sAMM-USD+/USDC');
        });

        it('dystStable _calcOutGivenIn', async () => {
            const pairsLength = await factoryContract.allPairsLength();
            console.log('pairsLength', pairsLength.toString());
            let maxDeviation = 0;

            const startPair = 1; //7; // 7 - first stable pool
            for (let i = startPair; i < pairsLength; i++) {
                // const pairsToCheck = [
                //     7, 10, 11, 12, 13, 14, 19, 20, 24, 26, 27, 33, 41
                // ];
                // for (const i of pairsToCheck) {

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
                if (r[0].lt(minReserve) || r[1].lt(minReserve)) {
                    console.log('Reservers to low. Skipping...');
                    continue;
                }

                const outOnchain = BigInt(
                    await pairContract.getAmountOut(amount, token0)
                );
                console.log('outOnchain ', outOnchain);

                const fee = 1000000000000000000n / SWAP_FEE_FACTOR; // SOR uses 18 fixed points fee / ratio
                const outOffchain = _calcOutGivenIn(
                    r[0].toBigInt(),
                    r[1].toBigInt(),
                    amount.toBigInt(),
                    fee,
                    decimalsIn,
                    decimalsOut,
                    stable
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
