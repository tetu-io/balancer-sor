// TS_NODE_PROJECT='tsconfig.testing.json' npx mocha -r ts-node/register test/math.spec.ts

import dotenv from 'dotenv'; // for INFURA=key
dotenv.config();

import { assert, expect } from 'chai';
import dystPairAbi from '../src/pools/dystopiaStablePool/DystPair.json';
import dystFactorAbi from '../src/pools/dystopiaStablePool/DystFactory.json';
import ERC20Abi from '../test/abi/ERC20.json';
import { Contract } from '@ethersproject/contracts';
import { Network, PROVIDER_URLS } from './testScripts/constants';
import { JsonRpcProvider } from '@ethersproject/providers';
import {
    _calcInGivenOut,
    _calcOutGivenIn,
} from '../src/pools/dystopiaStablePool/dystopiaStableMath';
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

        it('dystStable _calcInGivenOut', async () => {
            // Dystopia not supports Buy side - tokens in for exact tokens out
            const amountIn = _calcInGivenOut(10n, 20n, 5n, 1n);
            expect(amountIn).is.eq(0n);
        });

        it('dystStable _calcOutGivenIn', async () => {
            const pairsLength = await factoryContract.allPairsLength();
            console.log('pairsLength', pairsLength.toString());

            const skipPairs = [21, 27];
            const startPair = 7; //7; // 7 - first stable pool
            // for (let i = startPair; i < pairsLength; i++) {
            const pairsToCheck = [
                /*7, 10,*/ 11, 12, 13, 14, 19, 20, 24, 26, 27, 33, 41,
            ];
            for (const i of pairsToCheck) {
                if (skipPairs.includes(i)) {
                    console.log(i, '- skipped');
                    continue;
                }

                const dystPairAddress = await factoryContract.allPairs(i);
                console.log(i, 'dystPairAddress', dystPairAddress);

                const pairContract = new Contract(
                    dystPairAddress,
                    dystPairAbi,
                    provider
                );

                // bypass non-stable pairs
                if (!(await pairContract.stable())) continue;
                console.log(
                    'It is stable. Testing\n-----------------------------'
                );

                const token0 = await pairContract.token0();
                console.log('token0', token0);

                const tokenContract = new Contract(token0, ERC20Abi, provider);

                const decimalsIn = await tokenContract.decimals();
                console.log('decimalsIn', decimalsIn);

                const amount = parseFixed('1', decimalsIn);

                console.log('amount', amount.toString());

                const r = await pairContract.getReserves();
                console.log('reserves', r[0].toString(), r[1].toString());

                const outOnchain = BigInt(
                    await pairContract.getAmountOut(amount, token0)
                );
                console.log('outOnchain ', outOnchain);

                const DYST_SWAP_FEE_RATIO = 2000n; // https://github.com/dystopia-exchange/dystopia-contracts/blob/0bf82cef3d94f1e35c2dd0dc84a8db246cef3ca4/contracts/base/core/DystPair.sol#L41
                const fee = 1000000000000000000n / DYST_SWAP_FEE_RATIO; // SOR uses 18 fixed points fee / ratio
                const outOffchain = _calcOutGivenIn(
                    r[0].toBigInt(),
                    r[1].toBigInt(),
                    amount.toBigInt(),
                    fee
                );
                console.log('outOffchain', outOffchain);
                const deviation = 1 - Number(outOffchain) / Number(outOnchain);
                console.log('deviation', (deviation * 100).toFixed(6), '%');
                console.log('-----------------------------');

                // assert.approximately(
                //     Number(outOnchain),
                //     Number(outOffchain),
                //     Number(outOnchain / 10000n),
                //     'wrong result'
                // );
            }
        }).timeout(1000000);
    });
});
