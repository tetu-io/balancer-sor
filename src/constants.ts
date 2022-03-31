import { Zero } from '@ethersproject/constants';
import { BigNumber } from '@ethersproject/bignumber';
import { SwapInfo } from './types';

// It will probably be necessary to have a huge value to act as infinity
export const HUGEVALUE = BigNumber.from(
    '1000000000000000000000000000000000000000000000000000000'
);

export const EMPTY_SWAPINFO: SwapInfo = {
    tokenAddresses: [],
    swaps: [],
    swapAmount: Zero,
    swapAmountForSwaps: Zero,
    tokenIn: '',
    tokenOut: '',
    returnAmount: Zero,
    returnAmountConsideringFees: Zero,
    returnAmountFromSwaps: Zero,
    marketSp: Zero.toString(),
};
