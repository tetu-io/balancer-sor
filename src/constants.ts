import { Zero } from '@ethersproject/constants';
import { SwapInfo } from './types';

export const POOL_SWAP_FEE_ONE = 10000;
export const POOL_SWAP_FEE_DECIMALS = 4;

export const PRICE_IMPACT_ONE = 100000000;

export const EMPTY_SWAPINFO: SwapInfo = {
    tokenAddresses: [],
    swaps: [],
    swapAmount: Zero,
    swapAmountForSwaps: Zero,
    tokenIn: '',
    tokenInForSwaps: '',
    tokenOut: '',
    tokenOutFromSwaps: '',
    returnAmount: Zero,
    returnAmountConsideringFees: Zero,
    returnAmountFromSwaps: Zero,
    marketSp: Zero.toString(),
    priceImpact: Zero.toString(),
    swapPlatforms: {},
};
