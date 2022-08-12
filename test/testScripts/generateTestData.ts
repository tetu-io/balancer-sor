import { BigNumber, parseFixed } from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import { SOR, SwapInfo } from '../../src';
import fs from 'fs';
import * as api from '../api/api';
import { ITokenData, UniswapSubgraphData } from '../api/api';
import {
    BALANCER_SUBGRAPH_URLS,
    CONTRACT_UTILS,
    DYSTOPIA_SUBGRAPH_URLS,
    EXCLUDE_TOKENS,
    MULTIADDR,
    Network,
    PROVIDER_URLS,
    SOR_CONFIG,
    UNISWAP_SUBGRAPHS,
} from '../api/config';
import { SorConfig } from '../../dist';
import { TOKENS } from './tokenAddresses';

export async function initAndGenerateTestData(
    networkId: Network,
    providerUrl: string,
    multiAddress: string,
    contractUtilsAddress: string,
    sorConfig: SorConfig,
    balancerSubgraphUrl: string,
    dystopiaSubgraphUrl: string,
    uniswapSubgraphs: UniswapSubgraphData[],
    excludeTokens: string[] = []
): Promise<void> {
    // Pools source can be Subgraph URL or pools data set passed directly
    // Update pools list with most recent onchain balances
    const provider = new JsonRpcProvider(providerUrl);

    const sor = await api.init(
        networkId,
        provider,
        multiAddress,
        sorConfig,
        balancerSubgraphUrl,
        dystopiaSubgraphUrl,
        uniswapSubgraphs
    );

    // const dexes = api.getDexes(sor);
    // console.log('dexes', dexes);

    // Generate test data for multiswap2 contract (tetu-contracts-io project)
    const a = TOKENS[sor.config.chainId];

    interface ITestSwap {
        tokenIn: ITokenData;
        tokenOut: ITokenData;
        amount: number;
    }

    // this data needed for coverage and simple tests
    /* const testSwaps: ITestSwap[] = [
        // Coverage tests (do not change values)
        { tokenIn: a.WMATIC, tokenOut: a.USDC, amount: 1000000 },
        { tokenIn: a.USDC, tokenOut: a.WMATIC, amount: 1000000 },
        // Dystopia
        { tokenIn: a.USDC, tokenOut: a.DYST, amount: 1000 },
        { tokenIn: a.DYST, tokenOut: a.WMATIC, amount: 10000 },
        // Balancer
        { tokenIn: a.USDC, tokenOut: a.BAL, amount: 100000 },
        { tokenIn: a.BAL, tokenOut: a.USDC, amount: 10000 },
        // Tetu
        { tokenIn: a.USDC, tokenOut: a.TETU, amount: 1000 },
        { tokenIn: a.TETU, tokenOut: a.USDC, amount: 100000 },
    ];*/

    // Dystopia-related pairs test data
    const testSwapsDyst: ITestSwap[] = [];
    const pairsToCheckDyst =
        'USDC/WMATIC, WMATIC/USDC, USDT/WMATIC, USD+/WMATIC, WMATIC/USD+, WMATIC/USDT, WETH/WMATIC, USD+/USDC, USDC/USD+, WMATIC/WETH, USDC/WETH, WETH/USDC, DYST/WMATIC, stMATIC/WMATIC, USD+/TETU, FXS/FRAX, FRAX/WMATIC, USD+/WETH, WETH/USD+, miMATIC/FRAX, USD+/stMATIC, TETU/USD+, stMATIC/USD+, WMATIC/stMATIC, KOGECOIN/USDC, DAI/USDC, USDC/FRAX, USDC/agEUR, WMATIC/FRAX, USD+/CLAM, MaticX/WMATIC, USDC/KOGECOIN, WMATIC/DYST, USDC/USDT, USDC/Qi, Qi/USDC, COMFI/WMATIC, miMATIC/USDC, Qi/vQi, USDC/miMATIC, WETH/WBTC, WMATIC/TETU, KOGECOIN/WMATIC, DYST/USD+, DYST/miMATIC'.split(
            ', '
        );

    for (const pair of pairsToCheckDyst) {
        const symbols = pair.split('/');
        const tokenIn = a[symbols[0]];
        const tokenOut = a[symbols[1]];
        if (!tokenIn || !tokenOut)
            console.warn(`No token found! (Pair:${pair})`);
        else {
            const amount = 10;
            const testSwap = { tokenIn, tokenOut, amount };
            testSwapsDyst.push(testSwap);
        }
    }
    const path = '../tetu-contracts-io/test/infrastructure/json/';
    // const testDataFilename = path + 'MultiSwap2TestData.json';
    const testDataFilenameDyst = path + 'MultiSwap2TestDataDyst.json';

    // Do not update testSwaps, if you do not want to update/fix tests at tetu-contracts-io
    // await generateTestData(sor, testSwaps, testDataFilename);
    await generateTestData(
        sor,
        testSwapsDyst,
        testDataFilenameDyst,
        excludeTokens
    );
}

// noinspection JSUnusedLocalSymbols
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateTestData(
    sor: SOR,
    testSwaps,
    testDataFilename,
    excludeTokens
) {
    interface ITestData {
        [key: string]: SwapInfo;
    }

    const testData: ITestData = {};
    for (const swap of testSwaps) {
        const key =
            swap.amount.toString() +
            ' ' +
            swap.tokenIn.symbol +
            '->' +
            swap.tokenOut.symbol;
        console.log('\n-----------------------');
        console.log(key);

        const amount = parseFixed(
            swap.amount.toString(),
            swap.tokenIn.decimals
        );

        const swapData = await api.getSwap(
            sor,
            swap.tokenIn,
            swap.tokenOut,
            amount,
            [],
            excludeTokens
        );

        if (swapData.swaps.length) testData[key] = swapData;
        else {
            console.warn('ROUTE NOT FOUND !!!!');
            // throw new Error('ROUTE NOT FOUND !!!!');
        }
    }

    const latestBlock = await sor.provider.getBlock('latest');
    console.log('!Routes data calculated for block:', latestBlock.number);

    const testObject = { blockNumber: latestBlock.number, testData };

    // serialize BigNumbers as strings
    Object.defineProperties(BigNumber.prototype, {
        toJSON: {
            value: function (this: BigNumber) {
                return this.toString();
            },
        },
    });

    const jsonText = JSON.stringify(testObject, undefined, '\t');
    fs.writeFile(testDataFilename, jsonText, function (err) {
        if (err) return console.error('Error:', err);
        else console.log('testData saved to:', testDataFilename);
    });
}

// $ TS_NODE_PROJECT='tsconfig.testing.json' ts-node ./test/testScripts/swapExample.ts
const networkId = Network.POLYGON;
initAndGenerateTestData(
    Network.POLYGON,
    PROVIDER_URLS[networkId],
    MULTIADDR[networkId],
    CONTRACT_UTILS[networkId],
    SOR_CONFIG[networkId],
    BALANCER_SUBGRAPH_URLS[networkId],
    DYSTOPIA_SUBGRAPH_URLS[networkId],
    UNISWAP_SUBGRAPHS[networkId],
    EXCLUDE_TOKENS[networkId]
).then();
