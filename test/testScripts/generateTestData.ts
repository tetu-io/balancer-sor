import { BigNumber, parseFixed } from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import { SOR, SwapInfo } from '../../src';
import fs from 'fs';
import * as api from '../api/api';
import {
    BALANCER_SUBGRAPH_URLS,
    CONTRACT_UTILS,
    MULTIADDR,
    Network,
    PROVIDER_URLS,
    SOR_CONFIG,
    UNISWAP_SUBGRAPHS,
} from '../api/config';
import { SorConfig } from '../../dist';
import { UniswapSubgraphData } from '../api/api';
import { TOKENS } from './tokenAddresses';

export async function initAndGenerateTestData(
    networkId: Network,
    providerUrl: string,
    multiAddress: string,
    contractUtilsAddress: string,
    sorConfig: SorConfig,
    balancerSubgraphUrl: string,
    uniswapSubgraphs: UniswapSubgraphData[]
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
        uniswapSubgraphs
    );

    const dexes = api.getDexes(sor);
    console.log('dexes', dexes);

    // Generate test data for multiswap2 contract
    await generateTestData(sor);
}

// noinspection JSUnusedLocalSymbols
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateTestData(sor: SOR) {
    const a = TOKENS[sor.config.chainId];

    const testSwaps = [
        { tokenIn: a.USDC, tokenOut: a.WMATIC, amount: 100000 },
        { tokenIn: a.WMATIC, tokenOut: a.USDC, amount: 100000 },
        { tokenIn: a.BAL, tokenOut: a.SAND, amount: 1000 },
        { tokenIn: a.SAND, tokenOut: a.BAL, amount: 1000 },
        { tokenIn: a.BAL, tokenOut: a.TETU, amount: 1000 },
        { tokenIn: a.TETU, tokenOut: a.BAL, amount: 100000 },
        { tokenIn: a.BAL, tokenOut: a.cxETH, amount: 100 },
        { tokenIn: a.cxETH, tokenOut: a.BAL, amount: 10 },
        { tokenIn: a.BAL, tokenOut: a.SUSHI, amount: 1000 },
        { tokenIn: a.SUSHI, tokenOut: a.BAL, amount: 1000 },
        { tokenIn: a.SUSHI, tokenOut: a.TETU, amount: 1000 },
        { tokenIn: a.TETU, tokenOut: a.SUSHI, amount: 1000 },
        // TO DO WMATIC, MATIC
    ];

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
        console.log('-----------------------');
        const amount = parseFixed(
            swap.amount.toString(),
            swap.tokenIn.decimals
        );
        // await sor.fetchPools();
        testData[key] = await api.getSwap(
            sor,
            swap.tokenIn,
            swap.tokenOut,
            amount
        );
    }

    const latestBlock = await sor.provider.getBlock('latest');
    console.log('!Routes data calculated for block:', latestBlock.number);

    const testObject = { blockNumber: latestBlock.number, testData };

    const testDataFilename =
        '../tetu-contracts-io/test/infrastructure/json/MultiSwap2TestData.json';

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
    UNISWAP_SUBGRAPHS[networkId]
).then();
