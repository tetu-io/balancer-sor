import { BigNumber } from '@ethersproject/bignumber';
import { BigNumber as OldBigNumber } from './utils/bignumber';

export interface SorConfig {
    chainId: number;
    vault: string;
    weth: string;
    staBal3Pool?: { id: string; address: string };
    usdcConnectingPool?: { id: string; usdc: string };
    wETHwstETH?: { id: string; address: string };
    lbpRaisingTokens?: string[];
}

export type NoNullableField<T> = {
    [P in keyof T]: NonNullable<T[P]>;
};

export enum SwapTypes {
    SwapExactIn,
    SwapExactOut,
}

export enum PoolTypes {
    Weighted,
    Stable,
    Element,
    MetaStable,
    Linear,
    Gyro2,
    Gyro3,
    // UniswapV2, // TODO
}

export interface SwapOptions {
    gasPrice: BigNumber;
    swapGas: BigNumber;
    timestamp: number;
    maxPools: number;
    poolTypeFilter: PoolFilter;
    forceRefresh: boolean;
    excludePlatforms: string[];
    excludeTokens: string[];
}

export type PoolPairBase = {
    id: string;
    address: string;
    poolType: PoolTypes;
    swapFee: BigNumber;
    tokenIn: string;
    tokenOut: string;
    decimalsIn: number;
    decimalsOut: number;
    balanceIn: BigNumber;
    balanceOut: BigNumber;
    dystStable?: boolean;
};

export interface Swap {
    pool: string;
    tokenIn: string;
    tokenOut: string;
    swapAmount?: string;
    limitReturnAmount?: string;
    maxPrice?: string;
    tokenInDecimals: number;
    tokenOutDecimals: number;
}

export interface SubgraphPoolBase {
    platform?: string; // for platform filtering etc.
    id: string;
    address: string;
    poolType: string;
    swapFee: string;
    swapEnabled: boolean;
    totalShares: string;
    tokens: SubgraphToken[];
    tokensList: string[];

    // Weighted & Element field
    totalWeight?: string;

    // Stable specific fields
    amp?: string;

    // Element specific fields
    expiryTime?: number;
    unitSeconds?: number;
    principalToken?: string;
    baseToken?: string;

    // Linear specific fields
    mainIndex?: number;
    wrappedIndex?: number;
    lowerTarget?: string;
    upperTarget?: string;

    // Gyro2 specific field
    sqrtAlpha?: string;
    sqrtBeta?: string;

    // Gyro3 specific field
    root3Alpha?: string;

    // Dystopia (Solidly) specific fields
    dystStable?: boolean;
}

export type SubgraphToken = {
    address: string;
    balance: string;
    decimals: number;
    priceRate: string;
    // WeightedPool field
    weight: string | null;
};

export interface SwapV2 {
    poolId: string;
    assetInIndex: number;
    assetOutIndex: number;
    amount: string;
    userData: string;
    platformFee: number;
}

export interface PoolDexNames {
    [poolId: string]: string;
}

export interface SwapInfo {
    swapData?: SwapData;
    tokenAddresses: string[];
    swaps: SwapV2[];
    swapAmount: BigNumber;
    swapAmountForSwaps: BigNumber; // Used with stETH/wstETH
    returnAmount: BigNumber;
    returnAmountFromSwaps: BigNumber; // Used with stETH/wstETH
    returnAmountConsideringFees: BigNumber;
    tokenIn: string;
    tokenInForSwaps?: string; // Used with stETH/wstETH
    tokenOut: string;
    tokenOutFromSwaps?: string; // Used with stETH/wstETH
    marketSp: string;
    priceImpact: string;
    swapPlatforms: PoolDexNames;
}

export interface SwapData {
    tokenIn: string;
    tokenOut: string;
    swapAmount: BigNumber;
    returnAmount: BigNumber;
}

export interface PoolDictionary {
    [poolId: string]: PoolBase;
}

export interface PoolPairDictionary {
    [tokenInOut: string]: PoolPairBase;
}

export interface hopDictionary {
    [hopToken: string]: Set<string>; // the set of pool ids
}

export interface NewPath {
    id: string; // pool address if direct path, contactenation of pool addresses if multihop
    swaps: Swap[];
    poolPairData: PoolPairBase[];
    limitAmount: BigNumber;
    pools: PoolBase[];
    filterEffectivePrice?: OldBigNumber; // TODO: This is just used for filtering, maybe there is a better way to filter?
}

export enum PoolFilter {
    All = 'All',
    Weighted = 'Weighted',
    Stable = 'Stable',
    MetaStable = 'MetaStable',
    LBP = 'LiquidityBootstrapping',
    Investment = 'Investment',
    Element = 'Element',
    AaveLinear = 'AaveLinear',
    StablePhantom = 'StablePhantom',
    ERC4626Linear = 'ERC4626Linear',
    Gyro2 = 'Gyro2',
    Gyro3 = 'Gyro3',
    // TODO Uniswap, Dystopia Stable Pool
}

export interface PoolBase {
    platform?: string;
    poolType: PoolTypes;
    id: string;
    address: string;
    tokensList: string[];
    mainIndex?: number;
    isLBP?: boolean;
    parsePoolPairData: (tokenIn: string, tokenOut: string) => PoolPairBase;
    getNormalizedLiquidity: (poolPairData: PoolPairBase) => OldBigNumber;
    getLimitAmountSwap: (
        poolPairData: PoolPairBase,
        swapType: SwapTypes
    ) => OldBigNumber;
    /**
     * @param {string} token - Address of token.
     * @param {BigNumber} newBalance - New balance of token. EVM scaled.
     */
    updateTokenBalanceForPool: (token: string, newBalance: BigNumber) => void;
    _exactTokenInForTokenOut: (
        poolPairData: PoolPairBase,
        amount: OldBigNumber
    ) => OldBigNumber;
    _tokenInForExactTokenOut: (
        poolPairData: PoolPairBase,
        amount: OldBigNumber
    ) => OldBigNumber;
    _spotPriceAfterSwapExactTokenInForTokenOut: (
        poolPairData: PoolPairBase,
        amount: OldBigNumber
    ) => OldBigNumber;
    _spotPriceAfterSwapTokenInForExactTokenOut: (
        poolPairData: PoolPairBase,
        amount: OldBigNumber
    ) => OldBigNumber;
    _derivativeSpotPriceAfterSwapExactTokenInForTokenOut: (
        poolPairData: PoolPairBase,
        amount: OldBigNumber
    ) => OldBigNumber;
    _derivativeSpotPriceAfterSwapTokenInForExactTokenOut: (
        poolPairData: PoolPairBase,
        amount: OldBigNumber
    ) => OldBigNumber;
}

export interface WeightedPool extends PoolBase {
    totalWeight: string;
}

export interface TokenPriceService {
    /**
     * This should return the price of the native asset (ETH) in the token defined by tokenAddress.
     * Example: BAL = $20 USD, ETH = $4,000 USD, then 1 ETH = 200 BAL. This function would return 200.
     * @param tokenAddress
     */
    getNativeAssetPriceInToken(tokenAddress: string): Promise<string>;
}

export interface PoolDataService {
    name?: string;
    dexType?: string;
    dexId?: number;
    poolIdMask?: string;
    getPools(): Promise<SubgraphPoolBase[]>;
}

export type Gyro2PriceBounds = {
    lowerBound: string;
    upperBound: string;
    tokenInAddress: string;
    tokenOutAddress: string;
};

export type Gyro3PriceBounds = {
    alpha: string; // Assume symmetric price bounds for Gyro 3 pool
    // (The price range for any asset pair is equal to [alpha, 1/alpha])
};
