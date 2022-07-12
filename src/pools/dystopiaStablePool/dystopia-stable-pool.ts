import { MathSol } from '../../utils/basicOperations';

export const RESERVE_LIMIT = BigInt(2) ** BigInt(112) - BigInt(1);
export const SWAP_FEE_FACTOR = BigInt(2000);

export const BI_POWS = new Array(37)
    .fill(undefined)
    .map((_0, index) => BigInt(`1${'0'.repeat(index)}`));

const e18 = BI_POWS[18];

function _k(
    x: bigint,
    y: bigint,
    decimals0: bigint,
    decimals1: bigint
): bigint {
    const _x = (x * e18) / decimals0;
    const _y = (y * e18) / decimals1;
    const _a = (_x * _y) / e18;
    const _b = (_x * _x) / e18 + (_y * _y) / e18;
    // x3y+y3x >= k
    return (_a * _b) / e18;
}

function _f(x0: bigint, y: bigint): bigint {
    return (
        (x0 * ((((y * y) / e18) * y) / e18)) / e18 +
        (((((x0 * x0) / e18) * x0) / e18) * y) / e18
    );
}

function _d(x0: bigint, y: bigint): bigint {
    return (
        (BigInt(3) * x0 * ((y * y) / e18)) / e18 +
        (((x0 * x0) / e18) * x0) / e18
    );
}

function _getY(x0: bigint, xy: bigint, y: bigint): bigint {
    for (let i = 0; i < 255; i++) {
        const yPrev = y;
        const k = _f(x0, y);
        if (k < xy) {
            const dy = ((xy - k) * e18) / _d(x0, y);
            y = y + dy;
        } else {
            const dy = ((k - xy) * e18) / _d(x0, y);
            y = y - dy;
        }
        if (_closeTo(y, yPrev, BigInt(1))) {
            break;
        }
    }
    return y;
}

function _closeTo(a: bigint, b: bigint, target: bigint) {
    if (a > b) {
        if (a - b <= target) {
            return true;
        }
    } else {
        if (b - a <= target) {
            return true;
        }
    }
    return false;
}

function getSellPrice(
    reservesIn: bigint,
    reservesOut: bigint,
    decimalsIn: bigint,
    decimalsOut: bigint,
    srcAmount: bigint,
    fee?: bigint
): bigint {
    if (BigInt(reservesIn) + srcAmount > RESERVE_LIMIT) {
        return BigInt(0);
    }

    const fees = fee
        ? MathSol.mulUpFixed(srcAmount, fee)
        : srcAmount / SWAP_FEE_FACTOR;
    const amountIn = srcAmount - fees;

    const reservesInN = BigInt(reservesIn);
    const reservesOutN = BigInt(reservesOut);
    const decimalsInN = BigInt(decimalsIn);
    const decimalsOutN = BigInt(decimalsOut);

    const xy = _k(reservesInN, reservesOutN, decimalsInN, decimalsOutN);
    const reserveA = (reservesInN * e18) / decimalsInN;
    const reserveB = (reservesOutN * e18) / decimalsOutN;
    const amountInNorm = (amountIn * e18) / decimalsInN;
    const y = reserveB - _getY(amountInNorm + reserveA, xy, reserveB);
    return (y * decimalsOutN) / e18;
}

export default getSellPrice;
