// TS_NODE_PROJECT='tsconfig.testing.json' npx mocha -r ts-node/register test/math.spec.ts
import { assert } from 'chai';
import { BigNumber as OldBigNumber } from '../src/utils/bignumber';
import { bnum } from '../src/utils/bignumber';
import { BAL, WETH } from './lib/constants';
import singleWeightedPool from './testData/weightedPools/singlePoolWithSwapEnabled.json';
import { DystopiaStablePool } from '../src/pools/dystopiaStablePool/dystopiaStablePool';

describe('dystStableMath tests', () => {
    // TO DO: add items using checkOutcome function
    context('spot prices', () => {
        const dsPool = DystopiaStablePool.fromPool(singleWeightedPool.pools[0]);
        const poolPairData = dsPool.parsePoolPairData(
            WETH.address,
            BAL.address
        );
        it('dystStable getAmountOut check', () => {
            console.log('dystStable');
        });
    });
});

function checkDerivative(
    fn: (
        poolPairData: any,
        amount: OldBigNumber,
        exact: boolean
    ) => OldBigNumber,
    der: (poolPairData: any, amount: OldBigNumber) => OldBigNumber,
    poolPairData: any,
    amount: number,
    delta: number,
    error: number,
    inverse = false
) {
    const x = bnum(amount);
    let incrementalQuotient = fn(poolPairData, x.plus(delta), true)
        .minus(fn(poolPairData, x, true))
        .div(delta);
    if (inverse) incrementalQuotient = bnum(1).div(incrementalQuotient);
    const der_ans = der(poolPairData, x);
    assert.approximately(
        incrementalQuotient.div(der_ans).toNumber(),
        1,
        error,
        'wrong result'
    );
}
