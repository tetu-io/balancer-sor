import { formatFixed } from '@ethersproject/bignumber';
import { BigNumber as OldBigNumber, bnum } from '../../utils/bignumber';
import { MathSol } from '../../utils/basicOperations';
import { PoolPairBase } from '../../types';
import getSellPrice from './dystopia-stable-pool';

// The following function are BigInt versions
// BigInt was requested from integrators as it is more efficient.
// Swap outcomes formulas should match exactly those from smart contracts.
// PairType = 'token->token'
// SwapType = 'swapExactIn'
export function _calcOutGivenIn(
    balanceIn: bigint,
    balanceOut: bigint,
    amountIn: bigint,
    fee: bigint
): bigint {
    return getSellPrice(balanceIn, balanceOut, 18n, 18n, amountIn, fee);
}

// PairType = 'token->token'
// SwapType = 'swapExactOut'
export function _calcInGivenOut(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    balanceIn: bigint,
    balanceOut: bigint,
    amountOut: bigint,
    fee: bigint
): bigint {
    return 0n; // buy side is not supported
}

function subtractFee(amount: bigint, fee: bigint): bigint {
    const feeAmount = MathSol.mulUpFixed(amount, fee);
    return amount - feeAmount;
}

// Number functions

function getSellPriceNum(
    reservesIn: number,
    reservesOut: number,
    decimalsIn: number,
    decimalsOut: number,
    srcAmount: number
): number {
    return Number(
        getSellPrice(
            BigInt(reservesIn),
            BigInt(reservesOut),
            BigInt(decimalsIn),
            BigInt(decimalsOut),
            BigInt(srcAmount)
        )
    );
}

function _calcOutGivenInNum(
    balanceIn: number,
    balanceOut: number,
    amountIn: number,
    fee: number
): number {
    const amountInWithFee = subtractFeeNum(amountIn, fee);
    return getSellPriceNum(balanceIn, balanceOut, 18, 18, amountInWithFee);
}

// PairType = 'token->token'
// SwapType = 'swapExactOut'
function _calcInGivenOutNum(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    balanceIn: number,
    balanceOut: number,
    amountOut: number,
    fee: number
): number {
    return 0; // buy side is not supported
}

function subtractFeeNum(amount: number, fee: number): number {
    const feeAmount = amount * fee;
    return amount - feeAmount;
}

// function addFee(amount: bigint, fee: bigint): bigint {
//     return MathSol.divUpFixed(amount, MathSol.complementFixed(fee));
// }

// TO DO - Swap old versions of these in Pool for the BigInt version
// PairType = 'token->token'
// SwapType = 'swapExactIn'
export function _spotPriceAfterSwapExactTokenInForTokenOutBigInt(
    balanceIn: bigint,
    balanceOut: bigint,
    amountIn: bigint,
    fee: bigint
): bigint {
    const balanceIn2 = MathSol.add(balanceIn, amountIn);
    const amountOut = _calcOutGivenIn(balanceIn, balanceOut, amountIn, fee);
    const balanceOut2 = MathSol.sub(balanceOut, amountOut);

    const numerator = MathSol.mulDownFixed(balanceIn2, MathSol.ONE);
    return MathSol.divUpFixed(numerator, balanceOut2);
}

// PairType = 'token->token'
// SwapType = 'swapExactOut'
export function _spotPriceAfterSwapTokenInForExactTokenOutBigInt(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    balanceIn: bigint,
    balanceOut: bigint,
    amountOut: bigint,
    fee: bigint
): bigint {
    return 0n; // buy side is not supported
}

// PairType = 'token->BPT'
// SwapType = 'swapExactOut'
// noinspection JSUnusedLocalSymbols
export function _spotPriceAfterSwapTokenInForExactBPTOut(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    amount: OldBigNumber,
    poolPairData: PoolPairBase
): OldBigNumber {
    return bnum(0); // UniswapV2 does not support BPT swaps // TODO check what return 0 is right idea
}

/////////
///  Derivatives of spotPriceAfterSwap
/////////

// PairType = 'token->token'
// SwapType = 'swapExactIn'
export function _derivativeSpotPriceAfterSwapExactTokenInForTokenOut(
    amount: OldBigNumber,
    poolPairData: PoolPairBase
): OldBigNumber {
    const Bi = parseFloat(
        formatFixed(poolPairData.balanceIn, poolPairData.decimalsIn)
    );
    const Bo = parseFloat(
        formatFixed(poolPairData.balanceOut, poolPairData.decimalsOut)
    );
    const Ai = amount.toNumber();
    const f = parseFloat(formatFixed(poolPairData.swapFee, 18));

    const sp = Bi / Bo;
    const Bi2 = Bi + Ai;
    const Bo2 = Bo - _calcOutGivenInNum(Bi, Bo, Ai, f);
    const sp2 = Bi2 / Bo2;
    return bnum(sp2 - sp);
}

// PairType = 'token->token'
// SwapType = 'swapExactOut'
export function _derivativeSpotPriceAfterSwapTokenInForExactTokenOut(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    amount: OldBigNumber,
    poolPairData: PoolPairBase
): OldBigNumber {
    return bnum(0); // buy side is not supported
}

// PairType = 'token->token'
// SwapType = 'swapExactIn'
export function _spotPriceAfterSwapExactTokenInForTokenOut(
    amount: OldBigNumber,
    poolPairData: PoolPairBase
): OldBigNumber {
    const Bi = parseFloat(
        formatFixed(poolPairData.balanceIn, poolPairData.decimalsIn)
    );
    const Bo = parseFloat(
        formatFixed(poolPairData.balanceOut, poolPairData.decimalsOut)
    );
    const Ai = amount.toNumber();
    const f = parseFloat(formatFixed(poolPairData.swapFee, 18));

    const Bi2 = Bi + Ai;
    const Bo2 = Bo - _calcOutGivenInNum(Bi, Bo, Ai, f);
    const sp2 = Bi2 / Bo2;
    return bnum(sp2);
}

// PairType = 'token->token'
// SwapType = 'swapExactOut'
export function _spotPriceAfterSwapTokenInForExactTokenOut(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    amount: OldBigNumber,
    poolPairData: PoolPairBase
): OldBigNumber {
    return bnum(0); // buy side is not supported
}
