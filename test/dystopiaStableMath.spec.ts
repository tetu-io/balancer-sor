// TS_NODE_PROJECT='tsconfig.testing.json' npx mocha -r ts-node/register test/math.spec.ts

import dotenv from 'dotenv'; // for INFURA=key
dotenv.config();

import { assert, expect } from 'chai';
import dystPairAbi from '../src/pools/dystopiaStablePool/DystPair.json';
import { Contract } from '@ethersproject/contracts';
import { Network, PROVIDER_URLS } from './testScripts/constants';
import { JsonRpcProvider } from '@ethersproject/providers';
import {
    _calcInGivenOut,
    _calcOutGivenIn,
} from '../src/pools/dystopiaStablePool/dystopiaStableMath';
import { parseFixed } from '@ethersproject/bignumber';

describe('dystStableMath tests', function () {
    this.timeout(10000);
    context('spot prices', async () => {
        const dystStablePairAddress =
            '0x421a018cc5839c4c0300afb21c725776dc389b1a'; // https://info.dystopia.exchange/pair/0x421a018cc5839c4c0300afb21c725776dc389b1a
        const networkId = Network.POLYGON;
        const provider = new JsonRpcProvider(PROVIDER_URLS[networkId]);
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
            const amountIn = _calcInGivenOut(10n, 20n, 5n, 1n);
            expect(amountIn).is.eq(0n);
        });

        it('dystStable _calcOutGivenIn', async () => {
            const amount = parseFixed('1000', 6);
            console.log('amount', amount.toString());
            const token0 = await pairContract.token0();
            console.log('token0', token0);
            const outOnchain = BigInt(
                await pairContract.getAmountOut(amount, token0)
            );
            console.log('outOnchain ', outOnchain);

            const r = await pairContract.getReserves();
            // const fee = WeiPerEther.div(2000).toBigInt();
            const fee = parseFixed('1', 6).div(2000).toBigInt(); // TO DO check fee calc carefully
            console.log('fee', fee);
            const outOffchain = _calcOutGivenIn(
                r[0].toBigInt(),
                r[1].toBigInt(),
                amount.toBigInt(),
                fee
            );
            console.log('outOffchain', outOffchain);
            const deviation = 1 - Number(outOffchain) / Number(outOnchain);
            console.log('deviation', (deviation * 100).toFixed(6));

            assert.approximately(
                Number(outOnchain),
                Number(outOffchain),
                Number(outOnchain / 10000n),
                'wrong result'
            );
        });
    });
});
