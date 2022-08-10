import { Zero } from '@ethersproject/constants';
import { SwapInfo } from './types';

export const POOL_SWAP_FEE_RATE = 10000;
export const POOL_SWAP_FEE_DECIMALS = 4;

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
    swapPlatforms: {},
};
