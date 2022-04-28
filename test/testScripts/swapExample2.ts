// Example showing SOR with Vault batchSwap and Subgraph pool data, run using: $ TS_NODE_PROJECT='tsconfig.testing.json' ts-node ./test/testScripts/swapExample.ts

import * as dotenv from 'dotenv';
dotenv.config();

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
import relayerAbi from '../abi/BatchRelayer.json';
import erc20abi from '../abi/ERC20.json';
import { CoingeckoTokenPriceService } from '../lib/coingeckoTokenPriceService';
import { SubgraphPoolDataService } from '../lib/subgraphPoolDataService';
import { SubgraphUniswapPoolDataService } from '../lib/subgraphUniswapPoolDataService';
import { mockPoolDataService } from '../lib/mockPoolDataService';

export enum Network {
    POLYGON = 137,
}

export const SOR_CONFIG: Record<Network, SorConfig> = {
    [Network.POLYGON]: {
        chainId: Network.POLYGON, //137
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
        weth: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    },
};

export const PROVIDER_URLS = {
    [Network.POLYGON]: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA}`,
};

export const MULTIADDR: { [chainId: number]: string } = {
    137: '0xa1B2b503959aedD81512C37e9dce48164ec6a94d',
};

export const BALANCER_SUBGRAPH_URLS = {
    [Network.POLYGON]:
        'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-polygon-v2',
};

// id (range 0-15) is used to show swap dex on UI
export const UNISWAP_SUBGRAPHS = {
    [Network.POLYGON]: [
        {
            dexId: 0,
            url: 'https://api.thegraph.com/subgraphs/name/tetu-io/tetu-swap',
            swapFee: '0.01',
        },
        {
            dexId: 1,
            url: 'https://api.thegraph.com/subgraphs/name/sushiswap/matic-exchange',
        },
        {
            dexId: 2,
            url: 'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap06',
        }, // TODO find official subgraph
    ],
};

export const ADDRESSES = {
    [Network.POLYGON]: {
        MATIC: {
            address: AddressZero,
            decimals: 18,
            symbol: 'MATIC',
        },
        BAL: {
            address: '0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3',
            decimals: 18,
            symbol: 'BAL',
        },
        USDC: {
            address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            decimals: 6,
            symbol: 'USDC',
        },
        WBTC: {
            address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
            decimals: 8,
            symbol: 'WBTC',
        },
        WETH: {
            address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
            decimals: 18,
            symbol: 'WETH',
        },
        DAI: {
            address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
            decimals: 18,
            symbol: 'DAI',
        },
        STETH: {
            address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
            decimals: 18,
            symbol: 'STETH',
        },
        stUSD_PLUS: {
            address: '0x5a5c6aa6164750b530b8f7658b827163b3549a4d',
            decimals: 6,
            symbol: 'stUSD+',
        },
        bstUSD_PLUS: {
            address: '0x1aafc31091d93c3ff003cff5d2d8f7ba2e728425',
            decimals: 18,
            symbol: 'bstUSD+',
        },
        TETU: {
            address: '0x255707B70BF90aa112006E1b07B9AeA6De021424'.toLowerCase(),
            decimals: 18,
            symbol: 'TETU',
        },
    },
};

// This is the same across networks
const vaultAddr = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';

async function getSwap(
    provider: JsonRpcProvider,
    config: SorConfig,
    poolDataServices: PoolDataService[],
    tokenPriceService: TokenPriceService,
    tokenIn: { symbol: string; address: string; decimals: number },
    tokenOut: { symbol: string; address: string; decimals: number },
    swapType: SwapTypes,
    swapAmount: BigNumberish
): Promise<SwapInfo> {
    const sor = new SOR(provider, config, poolDataServices, tokenPriceService);

    await sor.fetchPools();

    // gasPrice is used by SOR as a factor to determine how many pools to swap against.
    // i.e. higher cost means more costly to trade against lots of different pools.
    const gasPrice = BigNumber.from('40000000000');
    // This determines the max no of pools the SOR will use to swap.
    const maxPools = 4;

    // This calculates the cost to make a swap which is used as an input to sor to allow it to make gas efficient recommendations.
    // Note - tokenOut for SwapExactIn, tokenIn for SwapExactOut
    const outputToken =
        swapType === SwapTypes.SwapExactOut ? tokenIn : tokenOut;
    const cost = await sor.getCostOfSwapInToken(
        outputToken.address,
        outputToken.decimals,
        gasPrice,
        BigNumber.from('35000')
    );
    const swapInfo: SwapInfo = await sor.getSwaps(
        tokenIn.address,
        tokenOut.address,
        swapType,
        swapAmount,
        { gasPrice, maxPools }
    );

    const amtInScaled =
        swapType === SwapTypes.SwapExactIn
            ? formatFixed(swapAmount, tokenIn.decimals)
            : formatFixed(swapInfo.returnAmount, tokenIn.decimals);
    const amtOutScaled =
        swapType === SwapTypes.SwapExactIn
            ? formatFixed(swapInfo.returnAmount, tokenOut.decimals)
            : formatFixed(swapAmount, tokenOut.decimals);

    const returnDecimals =
        swapType === SwapTypes.SwapExactIn
            ? tokenOut.decimals
            : tokenIn.decimals;

    const returnWithFeesScaled = formatFixed(
        swapInfo.returnAmountConsideringFees,
        returnDecimals
    );

    const costToSwapScaled = formatFixed(cost, returnDecimals);

    const swapTypeStr =
        swapType === SwapTypes.SwapExactIn ? 'SwapExactIn' : 'SwapExactOut';
    console.log(swapTypeStr);
    console.log(`Token In: ${tokenIn.symbol}, Amt: ${amtInScaled.toString()}`);
    console.log(
        `Token Out: ${tokenOut.symbol}, Amt: ${amtOutScaled.toString()}`
    );
    console.log(`Cost to swap: ${costToSwapScaled.toString()}`);
    console.log(`Return Considering Fees: ${returnWithFeesScaled.toString()}`);
    console.log(`Swaps:`);
    console.log(swapInfo.swaps);
    console.log(swapInfo.tokenAddresses);

    return swapInfo;
}

async function makeTrade(
    provider: JsonRpcProvider,
    swapInfo: SwapInfo,
    swapType: SwapTypes
) {
    if (!swapInfo.returnAmount.gt(0)) {
        console.log(`Return Amount is 0. No swaps to exectute.`);
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const key: any = process.env.TRADER_KEY;
    const wallet = new Wallet(key, provider);

    // if (swapInfo.tokenIn !== AddressZero) {
    //     // Vault needs approval for swapping non ETH
    //     console.log('Checking vault allowance...');
    //     const tokenInContract = new Contract(
    //         swapInfo.tokenIn,
    //         erc20abi,
    //         provider
    //     );

    //     let allowance = await tokenInContract.allowance(
    //         wallet.address,
    //         vaultAddr
    //     );

    //     if (allowance.lt(swapInfo.swapAmount)) {
    //         console.log(
    //             `Not Enough Allowance: ${allowance.toString()}. Approving vault now...`
    //         );
    //         const txApprove = await tokenInContract
    //             .connect(wallet)
    //             .approve(vaultAddr, MaxUint256);
    //         await txApprove.wait();
    //         console.log(`Allowance updated: ${txApprove.hash}`);
    //         allowance = await tokenInContract.allowance(
    //             wallet.address,
    //             vaultAddr
    //         );
    //     }

    //     console.log(`Allowance: ${allowance.toString()}`);
    // }

    const vaultContract = new Contract(vaultAddr, vaultArtifact, provider);
    vaultContract.connect(wallet);

    type FundManagement = {
        sender: string;
        recipient: string;
        fromInternalBalance: boolean;
        toInternalBalance: boolean;
    };

    const funds: FundManagement = {
        sender: wallet.address,
        recipient: wallet.address,
        fromInternalBalance: false,
        toInternalBalance: false,
    };

    const limits: string[] = getLimits(
        swapInfo.tokenIn,
        swapInfo.tokenOut,
        swapType,
        swapInfo.swapAmount,
        swapInfo.returnAmount,
        swapInfo.tokenAddresses
    );
    // const deadline = MaxUint256;

    console.log(funds);
    console.log(swapInfo.tokenAddresses);
    console.log(limits);
    console.log('Swapping...');

    const overRides = {};
    // overRides['gasLimit'] = '200000';
    // overRides['gasPrice'] = '20000000000';
    // ETH in swaps must send ETH value
    if (swapInfo.tokenIn === AddressZero) {
        overRides['value'] = swapInfo.swapAmount.toString();
    }

    const deltas = await vaultContract.queryBatchSwap(
        swapType, // SwapType 0=SwapExactIn, 1=SwapExactOut
        swapInfo.swaps,
        swapInfo.tokenAddresses,
        funds
    );
    console.log(deltas.toString());

    // const tx = await vaultContract
    //     .connect(wallet)
    //     .batchSwap(
    //         swapType,
    //         swapInfo.swaps,
    //         swapInfo.tokenAddresses,
    //         funds,
    //         limits,
    //         deadline,
    //         overRides
    //     );

    // console.log(`tx: ${tx.hash}`);
}

function getLimits(
    tokenIn: string,
    tokenOut: string,
    swapType: SwapTypes,
    swapAmount: BigNumber,
    returnAmount: BigNumber,
    tokenAddresses: string[]
): string[] {
    // Limits:
    // +ve means max to send
    // -ve mean min to receive
    // For a multihop the intermediate tokens should be 0
    // This is where slippage tolerance would be added
    const limits: string[] = [];
    const amountIn =
        swapType === SwapTypes.SwapExactIn ? swapAmount : returnAmount;
    const amountOut =
        swapType === SwapTypes.SwapExactIn ? returnAmount : swapAmount;

    tokenAddresses.forEach((token, i) => {
        if (token.toLowerCase() === tokenIn.toLowerCase())
            limits[i] = amountIn.toString();
        else if (token.toLowerCase() === tokenOut.toLowerCase()) {
            limits[i] = amountOut
                .mul('990000000000000000') // 0.99
                .div('1000000000000000000')
                .mul(-1)
                .toString()
                .split('.')[0];
        } else {
            limits[i] = '0';
        }
    });

    return limits;
}

async function makeRelayerTrade(
    provider: JsonRpcProvider,
    swapInfo: SwapInfo,
    swapType: SwapTypes,
    chainId: number
) {
    if (!swapInfo.returnAmount.gt(0)) {
        console.log(`Return Amount is 0. No swaps to exectute.`);
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const key: any = process.env.TRADER_KEY;
    const wallet = new Wallet(key, provider);

    if (swapInfo.tokenIn !== AddressZero) {
        // Vault needs approval for swapping non ETH
        console.log('Checking vault allowance...');
        const tokenInContract = new Contract(
            swapInfo.tokenIn,
            erc20abi,
            provider
        );

        let allowance = await tokenInContract.allowance(
            wallet.address,
            vaultAddr
        );
        if (allowance.lt(swapInfo.swapAmount)) {
            console.log(
                `Not Enough Allowance: ${allowance.toString()}. Approving vault now...`
            );
            const txApprove = await tokenInContract
                .connect(wallet)
                .approve(vaultAddr, MaxUint256);
            await txApprove.wait();
            console.log(`Allowance updated: ${txApprove.hash}`);
            allowance = await tokenInContract.allowance(
                wallet.address,
                vaultAddr
            );
        }

        console.log(`Allowance: ${allowance.toString()}`);
    }

    const relayerContract = new Contract(
        ADDRESSES[chainId].BatchRelayer.address,
        relayerAbi,
        provider
    );
    relayerContract.connect(wallet);

    type FundManagement = {
        sender: string;
        recipient: string;
        fromInternalBalance: boolean;
        toInternalBalance: boolean;
    };

    const funds: FundManagement = {
        sender: wallet.address,
        recipient: wallet.address,
        fromInternalBalance: false,
        toInternalBalance: false,
    };

    let tokenIn = swapInfo.tokenIn;
    let tokenOut = swapInfo.tokenOut;
    if (swapInfo.tokenIn === ADDRESSES[chainId].STETH.address) {
        tokenIn = ADDRESSES[chainId].wSTETH.address;
    }
    if (swapInfo.tokenOut === ADDRESSES[chainId].STETH.address) {
        tokenOut = ADDRESSES[chainId].wSTETH.address;
    }

    const limits: string[] = getLimits(
        swapInfo.tokenIn,
        swapInfo.tokenOut,
        swapType,
        swapInfo.swapAmount,
        swapInfo.returnAmount,
        swapInfo.tokenAddresses
    );

    const deadline = MaxUint256;

    console.log(funds);
    console.log(swapInfo.tokenAddresses);
    console.log(limits);

    console.log('Swapping...');

    const overRides = {};
    overRides['gasLimit'] = '450000';
    overRides['gasPrice'] = '20000000000';
    // ETH in swaps must send ETH value
    if (swapInfo.tokenIn === AddressZero) {
        overRides['value'] = swapInfo.swapAmountForSwaps?.toString();
    }

    // TODO do trough relayed Swapper contract only (no single swap)
    if (swapInfo.swaps.length === 1) {
        console.log('SINGLE SWAP');
        const single = {
            poolId: swapInfo.swaps[0].poolId,
            kind: swapType,
            assetIn: swapInfo.tokenAddresses[swapInfo.swaps[0].assetInIndex],
            assetOut: swapInfo.tokenAddresses[swapInfo.swaps[0].assetOutIndex],
            amount: swapInfo.swaps[0].amount,
            userData: swapInfo.swaps[0].userData,
        };

        if (!swapInfo.returnAmountFromSwaps) return;

        let limit = swapInfo.returnAmountFromSwaps.mul(1.01).toString(); // Max In
        if (swapType === SwapTypes.SwapExactIn)
            limit = swapInfo.returnAmountFromSwaps.mul(0.99).toString(); // Min return

        const tx = await relayerContract
            .connect(wallet)
            .callStatic.swap(single, funds, limit, deadline, overRides);
        console.log(tx.toString());
        console.log(swapInfo.returnAmountFromSwaps.mul(1.01).toString());
    } else {
        const tx = await relayerContract
            .connect(wallet)
            .batchSwap(
                swapType,
                swapInfo.swaps,
                swapInfo.tokenAddresses,
                funds,
                limits,
                deadline,
                overRides
            );
        console.log(`tx:`);
        console.log(tx);
    }
}

export async function simpleSwap() {
    const networkId = Network.POLYGON;
    // Pools source can be Subgraph URL or pools data set passed directly
    // Update pools list with most recent onchain balances

    const swapType = SwapTypes.SwapExactIn;

    // const tokenIn = ADDRESSES[networkId].bstUSD_PLUS;
    // const tokenOut = ADDRESSES[networkId].BAL;
    // const swapAmount = parseFixed('10', 18);

    const tokenIn = ADDRESSES[networkId].BAL;
    const tokenOut = ADDRESSES[networkId].TETU;
    const swapAmount = parseFixed('1000', 18);

    // const executeTrade = true;
    const executeTrade = false;

    const provider = new JsonRpcProvider(PROVIDER_URLS[networkId]);

    // This can be useful for debug
    // Fetch & print list of pools from Subgraph
    // let subgraphPools = await fetchSubgraphPools(SUBGRAPH_URLS[networkId]);
    // console.log(`-------`)
    // console.log(JSON.stringify(subgraphPools));
    // console.log(`-------`);

    const subgraphBalancerPoolDataService = new SubgraphPoolDataService({
        chainId: networkId,
        vaultAddress: vaultAddr,
        multiAddress: MULTIADDR[networkId],
        provider,
        subgraphUrl: BALANCER_SUBGRAPH_URLS[networkId],
        onchain: true,
    });

    const subgraphUniswapPoolDataServices = UNISWAP_SUBGRAPHS[networkId].map(
        (graph) =>
            new SubgraphUniswapPoolDataService({
                chainId: networkId,
                vaultAddress: vaultAddr,
                multiAddress: MULTIADDR[networkId],
                provider,
                subgraphUrl: graph.url,
                onchain: true,
                swapFee: graph.swapFee,
            })
    );
    const subgraphPoolDataServices: PoolDataService[] = [
        subgraphBalancerPoolDataService,
        ...subgraphUniswapPoolDataServices,
    ];
    // const subgraphPoolDataServices: PoolDataService[] = [subgraphBalancerPoolDataService]; // TODO remove

    // Use the mock pool data service if you want to use pool data from a file.
    // const poolsSource = require('../testData/testPools/gusdBug.json');
    // mockPoolDataService.setPools(poolsSource);

    const coingeckoTokenPriceService = new CoingeckoTokenPriceService(
        networkId
    );

    // Use the mock token price service if you want to manually set the token price in native asset
    //  mockTokenPriceService.setTokenPrice('0.001');

    const swapInfo = await getSwap(
        provider,
        SOR_CONFIG[networkId],
        subgraphPoolDataServices,
        // mockPoolDataService,
        coingeckoTokenPriceService,
        // mockTokenPriceService,
        tokenIn,
        tokenOut,
        swapType,
        swapAmount
    );
    // console.log('swapInfo', swapInfo);

    if (executeTrade) {
        if ([tokenIn, tokenOut].includes(ADDRESSES[networkId].STETH)) {
            console.log('RELAYER SWAP');
            await makeRelayerTrade(provider, swapInfo, swapType, networkId);
        } else {
            console.log('VAULT SWAP');
            await makeTrade(provider, swapInfo, swapType);
        }
    }
}

// $ TS_NODE_PROJECT='tsconfig.testing.json' ts-node ./test/testScripts/swapExample.ts
simpleSwap();
