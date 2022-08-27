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
    fee: bigint,
    decimalsIn: bigint,
    decimalsOut: bigint
): bigint {
    return getSellPrice(
        balanceIn,
        balanceOut,
        decimalsIn,
        decimalsOut,
        amountIn,
        fee
    );
}
