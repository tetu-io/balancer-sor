// Example showing SOR with Vault batchSwap and Subgraph pool data, run using: $ TS_NODE_PROJECT='tsconfig.testing.json' ts-node ./test/testScripts/swapExample.ts

import { BigNumber, BigNumberish, formatFixed } from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import {
    PoolDataService,
    SOR,
    SorConfig,
    SwapInfo,
    SwapTypes,
    TokenPriceService,
} from '../../src';
import ContractUtilsAbi from '../abi/ContractUtils.json';
import { SubgraphPoolDataService } from '../lib/subgraphPoolDataService';
import { SubgraphUniswapPoolDataService } from '../lib/subgraphUniswapPoolDataService';
import { SubgraphDystopiaStablePoolDataService } from '../lib/subgraphDystopiaStablePoolDataService';
import { mockTokenPriceService } from '../lib/mockTokenPriceService';
import { balancerVaultAddress, MULTIADDR } from './config';

export interface UniswapSubgraphData {
    name: string;
    dexId: number;
    url: string;
    swapFee: string;
}

export const _SLIPPAGE_DENOMINATOR = 10000;

interface ITokens {
    [address: string]: ITokenData;
}

export async function getTokens(
    sor: SOR,
    contractUtilsAddress: string
): Promise<ITokens> {
    const pools = sor.getPools();
    const tokens: ITokens = {};
    for (const pool of pools) {
        for (const token of pool.tokens) {
            tokens[token.address] = {
                address: token.address,
                decimals: token.decimals,
                symbol: '', // let fill it later
            };
        }
    }
    const addresses = Object.keys(tokens);
    const contractUtils = new Contract(
        contractUtilsAddress,
        ContractUtilsAbi,
        sor.provider
    );
    const symbols = await contractUtils.erc20SymbolsSafe(addresses);
    for (const i in addresses) tokens[addresses[i]].symbol = symbols[i];
    return tokens;
}

// Init Smart Order Router and SubgraphPoolDataServices for it
export async function init(
    networkId: number,
    provider: JsonRpcProvider,
    multiAddress: string,
    sorConfig: SorConfig,
    balancerSubgraphUrl: string,
    dystopiaSubgraphUrl: string,
    uniswapSubgraphs: UniswapSubgraphData[]
): Promise<SOR> {
    const subgraphBalancerPoolDataService = new SubgraphPoolDataService(
        {
            chainId: networkId,
            vaultAddress: balancerVaultAddress,
            multiAddress,
            provider,
            subgraphUrl: balancerSubgraphUrl,
            onchain: true, // do not use 'false' as balancer do not provide right data on subgraph only - without onchain data
        },
        'Balancer'
    );

    const subgraphUniswapPoolDataServices = uniswapSubgraphs.map(
        (graph) =>
            new SubgraphUniswapPoolDataService(
                {
                    chainId: networkId,
                    multiAddress: MULTIADDR[networkId],
                    provider,
                    subgraphUrl: graph.url,
                    onchain: true,
                    swapFee: graph.swapFee,
                },
                graph.name,
                graph.dexId
            )
    );

    const subgraphDystopiaPoolDataService =
        new SubgraphDystopiaStablePoolDataService(
            {
                chainId: networkId,
                multiAddress,
                provider,
                subgraphUrl: dystopiaSubgraphUrl,
                onchain: true, // do not use 'false' as balancer do not provide right data on subgraph only - without onchain data
            },
            'Dystopia',
            0
        );

    const subgraphPoolDataServices: PoolDataService[] = [
        subgraphBalancerPoolDataService,
        subgraphDystopiaPoolDataService,
        ...subgraphUniswapPoolDataServices,
    ];

    // This can be useful for debug
    // Fetch & print list of pools from Subgraph
    // let subgraphPools = await fetchSubgraphPools(SUBGRAPH_URLS[networkId]);
    // console.log(`-------`)
    // console.log(JSON.stringify(subgraphPools));
    // console.log(`-------`);

    /// CoinGecko does not work for TETU end some rare tokens // may be to add another price source?
    // Also, it slow-downs route building. Prefer do not use it!
    // const coingeckoTokenPriceService = new CoingeckoTokenPriceService(
    //     networkId
    // );
    // Use the mock token price service if you want to manually set the token price in native asset
    mockTokenPriceService.setTokenPrice('0'); // Output token price

    return initSOR(
        provider,
        sorConfig,
        subgraphPoolDataServices,
        // mockPoolDataService,
        mockTokenPriceService
        // coingeckoTokenPriceService,
    );
}

// Init Smart Order Router and SubgraphPoolDataServices for it
// Use it when you initialize PoolDataServices by yourself
export async function initSOR(
    provider: JsonRpcProvider,
    config: SorConfig,
    poolDataServices: PoolDataService[],
    tokenPriceService: TokenPriceService
): Promise<SOR> {
    const sor = new SOR(provider, config, poolDataServices, tokenPriceService);
    console.log('Fetching pools...');
    console.time('fetchPools');
    await sor.fetchPools();
    console.timeEnd('fetchPools');
    return sor;
}

export interface ITokenData {
    symbol: string;
    address: string;
    decimals: number;
}

// Make API endpoint for this function (use server's SOR, but tokenIn, tokenOut and swapAmount - from client)
export async function getSwap(
    sor: SOR,
    tokenIn: ITokenData,
    tokenOut: ITokenData,
    swapAmount: BigNumberish,
    excludePlatforms: string[] = []
): Promise<SwapInfo> {
    // gasPrice is used by SOR as a factor to determine how many pools to swap against.
    // i.e. higher cost means more costly to trade against lots of different pools.
    const gasPrice = BigNumber.from('40000000000');
    // This determines the max no of pools the SOR will use to swap.
    const maxPools = 4;

    // This calculates the cost to make a swap which is used as an input to sor to allow it to make gas efficient recommendations.
    // Note - tokenOut for SwapExactIn, tokenIn for SwapExactOut
    console.time('getCostOfSwapInToken');
    const cost = await sor.getCostOfSwapInToken(
        tokenOut.address,
        tokenOut.decimals,
        gasPrice,
        BigNumber.from('35000')
    );
    console.timeEnd('getCostOfSwapInToken');

    console.time('getSwaps');
    const swapInfo: SwapInfo = await sor.getSwaps(
        tokenIn.address,
        tokenOut.address,
        SwapTypes.SwapExactIn,
        swapAmount,
        { gasPrice, maxPools, excludePlatforms, forceRefresh: true }
    );
    console.timeEnd('getSwaps');

    const amtInScaled = formatFixed(swapAmount, tokenIn.decimals);
    const amtOutScaled = formatFixed(swapInfo.returnAmount, tokenOut.decimals);
    const returnDecimals = tokenOut.decimals;

    const returnWithFeesScaled = formatFixed(
        swapInfo.returnAmountConsideringFees,
        returnDecimals
    );

    const costToSwapScaled = formatFixed(cost, returnDecimals);

    console.log(`Token In: ${tokenIn.symbol}, Amt: ${amtInScaled.toString()}`);
    console.log(
        `Token Out: ${tokenOut.symbol}, Amt: ${amtOutScaled.toString()}`
    );
    console.log(`Cost to swap: ${costToSwapScaled.toString()}`);
    console.log(`Return Considering Fees: ${returnWithFeesScaled.toString()}`);
    // console.log('swapInfo', swapInfo);

    return swapInfo;
}

export interface IDex {
    name?: string;
    dexType?: string;
    mask?: string;
    dexId?: number;
}

export type IDexes = IDex[];

export function getDexes(sor: SOR): IDexes {
    const dataServices = sor.poolDataServiceOrServices as PoolDataService[];
    return dataServices.map((ds) => {
        return {
            name: ds.name,
            dexType: ds.dexType,
            mask: ds.poolIdMask,
            dexId: ds.dexId,
        } as IDex;
    });
}

export function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
