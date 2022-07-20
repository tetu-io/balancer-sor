import { formatFixed } from '@ethersproject/bignumber';
import { BigNumber as OldBigNumber, bnum } from '../../utils/bignumber';
import { MathSol } from '../../utils/basicOperations';
import { PoolPairBase } from '../../types';

// The following function are BigInt versions implemented by Sergio.
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
    // is it necessary to check ranges of variables? same for the other functions
    const amountInWithFee = subtractFee(amountIn, fee);
    const numerator = MathSol.mul(amountInWithFee, balanceOut);
    const denominator = MathSol.add(balanceIn, amountInWithFee);
    return MathSol.divDown(numerator, denominator);
}

// PairType = 'token->token'
// SwapType = 'swapExactOut'
export function _calcInGivenOut(
    balanceIn: bigint,
    balanceOut: bigint,
    amountOut: bigint,
    fee: bigint
): bigint {
    const numerator = MathSol.mul(balanceIn, amountOut);
    const denominator = subtractFee(MathSol.sub(balanceOut, amountOut), fee);
    return MathSol.divUp(numerator, denominator);
}

function subtractFee(amount: bigint, fee: bigint): bigint {
    const feeAmount = MathSol.mulUpFixed(amount, fee);
    return amount - feeAmount;
}

// Number functions

function _calcOutGivenInNum(
    balanceIn: number,
    balanceOut: number,
    amountIn: number,
    fee: number
): number {
    const amountInWithFee = subtractFeeNum(amountIn, fee);
    const numerator = amountInWithFee * balanceOut;
    const denominator = balanceIn + amountInWithFee;
    return numerator / denominator;
}

// PairType = 'token->token'
// SwapType = 'swapExactOut'
function _calcInGivenOutNum(
    balanceIn: number,
    balanceOut: number,
    amountOut: number,
    fee: number
): number {
    const numerator = balanceIn * amountOut;
    const denominator = subtractFeeNum(balanceOut - amountOut, fee);
    return numerator / denominator;
}

function subtractFeeNum(amount: number, fee: number): number {
    const feeAmount = amount * fee;
    return amount - feeAmount;
}

// function addFee(amount: bigint, fee: bigint): bigint {
//     return MathSol.divUpFixed(amount, MathSol.complementFixed(fee));
// }

/*// TO DO - Swap old versions of these in Pool for the BigInt version
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
    balanceIn: bigint,
    balanceOut: bigint,
    amountOut: bigint,
    fee: bigint
): bigint {
    const amountIn = _calcInGivenOut(balanceIn, balanceOut, amountOut, fee);
    const balanceIn2 = MathSol.add(balanceIn, amountIn);
    const balanceOut2 = MathSol.sub(balanceOut, amountOut);

    const numerator = MathSol.mulDownFixed(balanceIn2, MathSol.ONE);
    return MathSol.divUpFixed(numerator, balanceOut2);
}

// PairType = 'token->BPT'
// SwapType = 'swapExactOut'
// noinspection JSUnusedLocalSymbols
export function _spotPriceAfterSwapTokenInForExactBPTOut(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    amount: OldBigNumber,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    poolPairData: PoolPairBase
): OldBigNumber {
    return bnum(0); // UniswapV2 does not support BPT swaps // TODO check what return 0 is right idea
}*/

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
    amount: OldBigNumber,
    poolPairData: PoolPairBase
): OldBigNumber {
    const Bi = parseFloat(
        formatFixed(poolPairData.balanceIn, poolPairData.decimalsIn)
    );
    const Bo = parseFloat(
        formatFixed(poolPairData.balanceOut, poolPairData.decimalsOut)
    );
    const Ao = amount.toNumber();
    const f = parseFloat(formatFixed(poolPairData.swapFee, 18));

    const sp = Bi / Bo;
    const Bi2 = Bi + _calcInGivenOutNum(Bi, Bo, Ao, f);
    const Bo2 = Bo - Ao;
    const sp2 = Bi2 / Bo2;
    return bnum(sp2 - sp);
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
    amount: OldBigNumber,
    poolPairData: PoolPairBase
): OldBigNumber {
    const Bi = parseFloat(
        formatFixed(poolPairData.balanceIn, poolPairData.decimalsIn)
    );
    const Bo = parseFloat(
        formatFixed(poolPairData.balanceOut, poolPairData.decimalsOut)
    );
    const Ao = amount.toNumber();
    const f = parseFloat(formatFixed(poolPairData.swapFee, 18));

    const Bi2 = Bi + _calcInGivenOutNum(Bi, Bo, Ao, f);
    const Bo2 = Bo - Ao;
    const sp2 = Bi2 / Bo2;
    return bnum(sp2);
}
