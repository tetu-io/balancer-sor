import { getAddress } from '@ethersproject/address';
import {
    BigNumber as OldBigNumber,
    bnum,
    scale,
    ZERO,
} from '../../utils/bignumber';
import { isSameAddress } from '../../utils';
import {
    PoolBase,
    PoolTypes,
    PoolPairBase,
    SwapTypes,
    SubgraphPoolBase,
    SubgraphToken,
    NoNullableField,
} from '../../types';
import {
    _calcOutGivenIn,
    _calcInGivenOut,
    _spotPriceAfterSwapExactTokenInForTokenOut,
    _spotPriceAfterSwapTokenInForExactTokenOut,
    _derivativeSpotPriceAfterSwapExactTokenInForTokenOut,
    _derivativeSpotPriceAfterSwapTokenInForExactTokenOut,
} from './uniswapV2Math';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther as ONE } from '@ethersproject/constants';

export type WeightedPoolToken = Pick<
    NoNullableField<SubgraphToken>,
    'address' | 'balance' | 'decimals' | 'weight'
>;

export class UniswapV2Pool implements PoolBase {
    platform = 'UniswapV2';
    poolType: PoolTypes = PoolTypes.Weighted;
    id: string;
    address: string;
    swapFee: BigNumber;
    totalShares: BigNumber;
    tokens: WeightedPoolToken[];
    tokensList: string[];
    MAX_IN_RATIO = parseFixed('0.3', 18);
    MAX_OUT_RATIO = parseFixed('0.3', 18);
    isLBP = false;

    static fromPool(pool: SubgraphPoolBase, isLBP?: boolean): UniswapV2Pool {
        if (!pool.totalWeight)
            throw new Error('Uniswap2Pool missing totalWeight');
        const uniswapV2Pool = new UniswapV2Pool(
            pool.id,
            pool.address,
            pool.swapFee,
            pool.totalShares,
            pool.tokens as WeightedPoolToken[],
            pool.tokensList
        );
        if (isLBP) uniswapV2Pool.isLBP = true;
        return uniswapV2Pool;
    }

    constructor(
        id: string,
        address: string,
        swapFee: string,
        totalShares: string,
        tokens: WeightedPoolToken[],
        tokensList: string[]
    ) {
        this.id = id;
        this.address = address;
        this.swapFee = parseFixed(swapFee, 18);
        this.totalShares = parseFixed(totalShares, 18);
        this.tokens = tokens;
        this.tokensList = tokensList;
    }

    parsePoolPairData(tokenIn: string, tokenOut: string): PoolPairBase {
        const tokenIndexIn = this.tokens.findIndex(
            (t) => getAddress(t.address) === getAddress(tokenIn)
        );
        if (tokenIndexIn < 0) throw 'Pool does not contain tokenIn';
        const tI = this.tokens[tokenIndexIn];
        const balanceIn = tI.balance;
        const decimalsIn = tI.decimals;

        const tokenIndexOut = this.tokens.findIndex(
            (t) => getAddress(t.address) === getAddress(tokenOut)
        );
        if (tokenIndexOut < 0) throw 'Pool does not contain tokenOut';
        const tO = this.tokens[tokenIndexOut];
        const balanceOut = tO.balance;
        const decimalsOut = tO.decimals;

        // noinspection UnnecessaryLocalVariableJS
        const poolPairData: PoolPairBase = {
            id: this.id,
            address: this.address,
            poolType: this.poolType,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            decimalsIn: Number(decimalsIn),
            decimalsOut: Number(decimalsOut),
            balanceIn: parseFixed(balanceIn, decimalsIn),
            balanceOut: parseFixed(balanceOut, decimalsOut),
            swapFee: this.swapFee,
        };

        return poolPairData;
    }

    // Normalized liquidity is an abstract term that can be thought of the
    // inverse of the slippage. It is proportional to the token balances in the
    // pool but also depends on the shape of the invariant curve.
    // As a standard, we define normalized liquidity in tokenOut
    getNormalizedLiquidity(poolPairData: PoolPairBase): OldBigNumber {
        return bnum(
            formatFixed(poolPairData.balanceOut, poolPairData.decimalsOut)
        );
    }

    getLimitAmountSwap(
        poolPairData: PoolPairBase,
        swapType: SwapTypes
    ): OldBigNumber {
        if (swapType === SwapTypes.SwapExactIn) {
            return bnum(
                formatFixed(
                    poolPairData.balanceIn.mul(this.MAX_IN_RATIO).div(ONE),
                    poolPairData.decimalsIn
                )
            );
        } else {
            return bnum(
                formatFixed(
                    poolPairData.balanceOut.mul(this.MAX_OUT_RATIO).div(ONE),
                    poolPairData.decimalsOut
                )
            );
        }
    }

    // Updates the balance of a given token for the pool
    updateTokenBalanceForPool(token: string, newBalance: BigNumber): void {
        // token is BPT
        if (this.address == token) {
            this.totalShares = newBalance;
        } else {
            // token is underlying in the pool
            const T = this.tokens.find((t) => isSameAddress(t.address, token));
            if (!T) throw Error('Pool does not contain this token');
            T.balance = formatFixed(newBalance, T.decimals);
        }
    }

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
                poolPairData.swapFee.toBigInt()
            );
            // return human scaled
            const amtOldBn = bnum(amt.toString());
            return scale(amtOldBn, -poolPairData.decimalsOut);
        } catch (err) {
            return ZERO;
        }
    }

    // Using BigNumber.js decimalPlaces (dp), allows us to consider token decimal accuracy correctly,
    // i.e. when using token with 2decimals 0.002 should be returned as 0
    // Uses ROUND_UP mode (0)
    // calcInGivenOut
    _tokenInForExactTokenOut(
        poolPairData: PoolPairBase,
        amount: OldBigNumber
    ): OldBigNumber {
        if (amount.isNaN()) return amount;

        try {
            const amt = _calcInGivenOut(
                poolPairData.balanceIn.toBigInt(),
                poolPairData.balanceOut.toBigInt(),
                parseFixed(
                    amount.dp(poolPairData.decimalsOut, 1).toString(),
                    poolPairData.decimalsOut
                ).toBigInt(),
                poolPairData.swapFee.toBigInt()
            );
            // return human scaled
            const amtOldBn = bnum(amt.toString());
            return scale(amtOldBn, -poolPairData.decimalsIn);
        } catch (err) {
            return ZERO;
        }
    }

    _spotPriceAfterSwapExactTokenInForTokenOut(
        poolPairData: PoolPairBase,
        amount: OldBigNumber
    ): OldBigNumber {
        return _spotPriceAfterSwapExactTokenInForTokenOut(amount, poolPairData);
    }

    _spotPriceAfterSwapTokenInForExactTokenOut(
        poolPairData: PoolPairBase,
        amount: OldBigNumber
    ): OldBigNumber {
        return _spotPriceAfterSwapTokenInForExactTokenOut(amount, poolPairData);
    }

    _derivativeSpotPriceAfterSwapExactTokenInForTokenOut(
        poolPairData: PoolPairBase,
        amount: OldBigNumber
    ): OldBigNumber {
        return _derivativeSpotPriceAfterSwapExactTokenInForTokenOut(
            amount,
            poolPairData
        );
    }

    _derivativeSpotPriceAfterSwapTokenInForExactTokenOut(
        poolPairData: PoolPairBase,
        amount: OldBigNumber
    ): OldBigNumber {
        return _derivativeSpotPriceAfterSwapTokenInForExactTokenOut(
            amount,
            poolPairData
        );
    }
}
