// Example showing SOR with Vault batchSwap and Subgraph pool data, run using: $ TS_NODE_PROJECT='tsconfig.testing.json' ts-node ./test/testScripts/swapExample.ts

import {
    BigNumber,
    BigNumberish,
    formatFixed,
    parseFixed,
} from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { Contract } from '@ethersproject/contracts';
import { AddressZero, MaxUint256 } from '@ethersproject/constants';
import {
    PoolDataService,
    SOR,
    SorConfig,
    SwapInfo,
    SwapTypes,
    TokenPriceService,
} from '../../src';
import vaultArtifact from '../../src/abi/Vault.json';
import erc20abi from '../abi/ERC20.json';
import { SubgraphPoolDataService } from '../lib/subgraphPoolDataService';
import { SubgraphUniswapPoolDataService } from '../lib/subgraphUniswapPoolDataService';
import { mockTokenPriceService } from '../lib/mockTokenPriceService';
import * as fs from 'fs';
import { balancerVaultAddress, MULTIADDR } from './config';
// import { CoingeckoTokenPriceService } from '../lib/coingeckoTokenPriceService';

export interface UniswapSubgraphData {
    name: string;
    dexId: number;
    url: string;
    swapFee: string;
}

export const _SLIPPAGE_DENOMINATOR = 10000;

// Init Smart Order Router and SubgraphPoolDataServices for it
export async function init(
    networkId: number,
    provider: JsonRpcProvider,
    multiAddress: string,
    sorConfig: SorConfig,
    balancerSubgraphUrl: string,
    uniswapSubgraphs: UniswapSubgraphData[]
) {
    // Use the mock pool data service if you want to use pool data from a file. (for testing purposes etc.)
    // const poolsSource = require('../testData/testPools/gusdBug.json');
    // mockPoolDataService.setPools(poolsSource);

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
                    vaultAddress: balancerVaultAddress,
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

    const subgraphPoolDataServices: PoolDataService[] = [
        subgraphBalancerPoolDataService,
        ...subgraphUniswapPoolDataServices,
    ];

    // This can be useful for debug
    // Fetch & print list of pools from Subgraph
    // let subgraphPools = await fetchSubgraphPools(SUBGRAPH_URLS[networkId]);
    // console.log(`-------`)
    // console.log(JSON.stringify(subgraphPools));
    // console.log(`-------`);

    /// CoinGecko does not work for TETU end some rare tokens // TODO may be add another price source?
    // Also it slow downs route building. Prefer do not use it!
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
) {
    const sor = new SOR(provider, config, poolDataServices, tokenPriceService);
    console.log('Fetching pools...');
    console.time('fetchPools');
    await sor.fetchPools(); // TODO call fetchPools() every minute on background at the server to cache it and quickly do getSwap
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
    swapAmount: BigNumberish
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
        { gasPrice, maxPools }
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

export function getDexes(sor: SOR) {
    const dataServices = sor.poolDataServiceOrServices as PoolDataService[];
    const dexes = dataServices.map((ds) => {
        return {
            name: ds.name,
            dexType: ds.dexType,
            mask: ds.poolIdMask,
            dexId: ds.dexId,
        };
    });
    return dexes;
}
