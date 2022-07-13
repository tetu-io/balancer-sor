import {
    BigNumber as OldBigNumber,
    bnum,
    scale,
    ZERO,
} from '../../utils/bignumber';
import {
    PoolTypes,
    PoolPairBase,
    SubgraphPoolBase,
    SubgraphToken,
    NoNullableField,
} from '../../types';
import { _calcOutGivenIn } from './dystopiaMath';
import { BigNumber, parseFixed } from '@ethersproject/bignumber';
import { UniswapV2Pool } from '../uniswapV2Pool/uniswapV2Pool';

export type UniswapV2PoolToken = Pick<
    NoNullableField<SubgraphToken>,
    'address' | 'balance' | 'decimals' | 'weight'
>;

// noinspection JSUnusedGlobalSymbols
export class DystopiaStablePool extends UniswapV2Pool {
    platform = 'Dystopia';
    poolType: PoolTypes = PoolTypes.Weighted; // TODO
    id: string;
    address: string;
    swapFee: BigNumber;
    totalShares: BigNumber;
    tokens: UniswapV2PoolToken[];
    tokensList: string[];
    MAX_IN_RATIO = parseFixed('0.3', 18);
    MAX_OUT_RATIO = parseFixed('0.3', 18);

    static fromPool(pool: SubgraphPoolBase): DystopiaStablePool {
        if (!pool.totalWeight)
            throw new Error('DystopiaStablePool missing totalWeight');

        const dystopiaStablePool = new DystopiaStablePool(
            pool.id,
            pool.address,
            pool.swapFee,
            pool.totalShares,
            pool.tokens as UniswapV2PoolToken[],
            pool.tokensList
        );
        return dystopiaStablePool;
    }

    // TODO
    // Using BigNumber.js decimalPlaces (dp), allows us to consider token decimal accuracy correctly,
    // i.e. when using token with 2decimals 0.002 should be returned as 0
    // Uses ROUND_DOWN mode (1)
    // calcOutGivenIn
    _exactTokenInForTokenOut(
        poolPairData: PoolPairBase,
        amount: OldBigNumber
    ): OldBigNumber {
        if (amount.isNaN()) return amount;

        try {
            const amt = _calcOutGivenIn(
                poolPairData.balanceIn.toBigInt(),
                poolPairData.balanceOut.toBigInt(),
                parseFixed(
                    amount.dp(poolPairData.decimalsIn, 1).toString(),
                    poolPairData.decimalsIn
                ).toBigInt(),
                poolPairData.swapFee.toBigInt(),
                BigInt(poolPairData.decimalsIn),
                BigInt(poolPairData.decimalsOut)
            );
            // return human scaled
            const amtOldBn = bnum(amt.toString());
            return scale(amtOldBn, -poolPairData.decimalsOut);
        } catch (err) {
            return ZERO;
        }
    }

    // calcInGivenOut
    _tokenInForExactTokenOut(
        poolPairData: PoolPairBase,
        amount: OldBigNumber
    ): OldBigNumber {
        if (amount.isNaN()) return amount;
        return ZERO; // buy side is not supported
    }
}
