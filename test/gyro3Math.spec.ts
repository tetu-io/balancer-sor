import { expect } from 'chai';
import cloneDeep from 'lodash.clonedeep';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { USDC, DAI } from './lib/constants';
// Add new PoolType
import { Gyro3Pool } from '../src/pools/gyro3Pool/gyro3Pool';
// Add new pool test data in Subgraph Schema format
import testPools from './testData/gyro3Pools/gyro3TestPool.json';
import {
    _calcNewtonDelta,
    _calculateCubicStartingPoint,
    _calculateCubicTerms,
    _runNewtonIteration,
    _normalizeBalances,
} from '../src/pools/gyro3Pool/gyro3Math';

describe('gyro3Math tests', () => {
    const testPool = cloneDeep(testPools).pools[0];
    const pool = Gyro3Pool.fromPool(testPool);

    const poolPairData = pool.parsePoolPairData(USDC.address, DAI.address);

    context('Calculate Invariant', () => {
        it(`should correctly calculate the terms of the cubic expression`, async () => {
            const normalizedBalances = _normalizeBalances(
                [
                    poolPairData.balanceIn,
                    poolPairData.balanceOut,
                    poolPairData.balanceTertiary,
                ],
                [
                    poolPairData.decimalsIn,
                    poolPairData.decimalsOut,
                    poolPairData.decimalsTertiary,
                ]
            );
            const [a, mb, mc, md] = _calculateCubicTerms(
                normalizedBalances,
                pool.root3Alpha
            );

            expect(formatFixed(a, 18)).to.equal('0.013000000000000127');
            expect(formatFixed(mb, 18)).to.equal('245387.995391323689889516');
            expect(formatFixed(mc, 18)).to.equal(
                '20335328582.7366683195765956'
            );
            expect(formatFixed(md, 18)).to.equal('561707977531810.0');
        });

        it(`should correctly calculate the starting point for the Newton method approximation of L`, async () => {
            const a = parseFixed('0.013000000000000127', 18);
            const mb = parseFixed('245387.995391323689889516', 18);
            const mc = parseFixed('20335328582.7366683195765956', 18);

            const l0 = _calculateCubicStartingPoint(a, mb, mc);

            expect(formatFixed(l0, 18)).to.equal('18937948.911434007702525325');
        });

        it(`should correctly calculate deltas for Newton method`, async () => {
            const a = parseFixed('0.013000000000000127', 18);
            const mb = parseFixed('245387.995391323689889516', 18);
            const mc = parseFixed('20335328582.7366683195765956', 18);
            const md = parseFixed('561707977531810.0', 18);

            const rootEst0 = parseFixed('18937948.911434007702525325', 18);

            const [deltaAbs1, deltaIsPos1] = _calcNewtonDelta(
                a,
                mb,
                mc,
                md,
                rootEst0
            );

            expect(formatFixed(deltaAbs1, 18)).to.equal(
                '20725.034790223169767955'
            );
            expect(deltaIsPos1).to.equal(true);

            const rootEst1 = parseFixed('18958673.94622423087229328', 18);

            const [deltaAbs2, deltaIsPos2] = _calcNewtonDelta(
                a,
                mb,
                mc,
                md,
                rootEst1
            );

            expect(formatFixed(deltaAbs2, 18)).to.equal(
                '45.163851832290322917'
            );
            expect(deltaIsPos2).to.equal(false);

            const rootEst2 = parseFixed('18958628.782372398581970363', 18);

            const [deltaAbs3, deltaIsPos3] = _calcNewtonDelta(
                a,
                mb,
                mc,
                md,
                rootEst2
            );

            expect(formatFixed(deltaAbs3, 18)).to.equal('0.000214713810115934');
            expect(deltaIsPos3).to.equal(false);

            const rootEst3 = parseFixed('18958628.782157684771854429', 18);

            const [deltaAbs4, deltaIsPos4] = _calcNewtonDelta(
                a,
                mb,
                mc,
                md,
                rootEst3
            );

            expect(formatFixed(deltaAbs4, 18)).to.equal('0.000000000004454138');
            expect(deltaIsPos4).to.equal(false);

            const rootEst4 = parseFixed('18958628.782157684767400291', 18);

            const [deltaAbs5, deltaIsPos5] = _calcNewtonDelta(
                a,
                mb,
                mc,
                md,
                rootEst4
            );

            expect(formatFixed(deltaAbs5, 18)).to.equal('0.000000000004453998');
            expect(deltaIsPos5).to.equal(false);

            const finalRootEst = _runNewtonIteration(a, mb, mc, md, rootEst0);

            expect(formatFixed(finalRootEst, 18)).to.equal(
                '18958628.782157684762946293'
            );
        });
    });
});

// a = 0.013000000000000127
// mb = 245387.995391323689889516
// mc = 20335328582.7366683195765956
// md = 561707977531810.0

// l0 = 18937948.911434007702525325
// l1 = 18,958,673.94622423087229328
// l2 = 18,958,628.782372398581970363
// l3 = 18,958,628.782157684771854429
// l4 = 18,958,628.782157684767400291
// lFinal = 18958628.782157684762946293
