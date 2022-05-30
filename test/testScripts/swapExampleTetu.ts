import { BigNumber, parseFixed } from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import { SOR, SwapInfo } from '../../src';
import fs from 'fs';
import * as api from '../api/api';
import { AddressZero, MaxUint256 } from '@ethersproject/constants';
import {
    BALANCER_SUBGRAPH_URLS,
    balancerVaultAddress,
    MULTIADDR,
    Network,
    PROVIDER_URLS,
    SOR_CONFIG,
    UNISWAP_SUBGRAPHS,
} from '../api/config';
import { SorConfig } from '../../dist';
import { ITokenData, UniswapSubgraphData } from '../api/api';
import { Wallet } from '@ethersproject/wallet';
import { Contract } from '@ethersproject/contracts';
import erc20abi from '../abi/ERC20.json';
import vaultArtifact from '../../src/abi/Vault.json';

const ADDRESSES = {
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
        WMATIC: {
            address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'.toLowerCase(),
            decimals: 18,
            symbol: 'WMATIC',
        },
        cxETH: {
            address: '0xfe4546feFe124F30788c4Cc1BB9AA6907A7987F9'.toLowerCase(),
            decimals: 18,
            symbol: 'cxETH',
        },
        SUSHI: {
            address: '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a'.toLowerCase(),
            decimals: 18,
            symbol: 'SUSHI',
        },
        SAND: {
            address: '0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683'.toLowerCase(),
            decimals: 18,
            symbol: 'SAND',
        },
    },
};

export async function swapExample(
    networkId: Network,
    providerUrl: string,
    multiAddress: string,
    sorConfig: SorConfig,
    balancerSubgraphUrl: string,
    uniswapSubgraphs: UniswapSubgraphData[],
    tokenIn: ITokenData,
    tokenOut: ITokenData,
    swapAmount: BigNumber,
    executeTrade: boolean
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

    console.time('getSwap');
    const swapInfo = await api.getSwap(sor, tokenIn, tokenOut, swapAmount);
    console.timeEnd('getSwap');
    // console.log('swapInfo', swapInfo);

    if (executeTrade) {
        console.log('VAULT SWAP');
        await makeTrade(provider, swapInfo);
    }
}

// Call this function from client
async function makeTrade(provider: JsonRpcProvider, swapInfo: SwapInfo) {
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
            balancerVaultAddress
        );

        if (allowance.lt(swapInfo.swapAmount)) {
            console.log(
                `Not Enough Allowance: ${allowance.toString()}. Approving vault now...`
            );
            const txApprove = await tokenInContract
                .connect(wallet)
                .approve(balancerVaultAddress, MaxUint256);
            await txApprove.wait();
            console.log(`Allowance updated: ${txApprove.hash}`);
            allowance = await tokenInContract.allowance(
                wallet.address,
                balancerVaultAddress
            );
        }

        console.log(`Allowance: ${allowance.toString()}`);
    }

    const vaultContract = new Contract(
        balancerVaultAddress,
        vaultArtifact,
        provider
    );
    vaultContract.connect(wallet);

    console.log(swapInfo.tokenAddresses);
    console.log('Swapping...');

    const overrides = {};
    // overrides['gasLimit'] = '200000';
    // overrides['gasPrice'] = '20000000000';
    // ETH in swaps must send ETH value
    if (swapInfo.tokenIn === AddressZero) {
        overrides['value'] = swapInfo.swapAmount.toString();
    }

    // const slippage = _SLIPPAGE_DENOMINATOR * 2 / 100; // 2%
    // const deadline = MaxUint256;

    // TODO call Tetu Multiswap2 contract
    // const tx = await Multiswap2Contract
    //     .connect(wallet)
    //     .multiswap(
    //         swapInfo.swapData,
    //         swapInfo.swaps,
    //         swapInfo.tokenAddresses,
    //         slippage,
    //         deadline,
    //         overrides
    //     );
    // console.log(`tx: ${tx.hash}`);
}

// noinspection JSUnusedLocalSymbols
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateTestData(sor: SOR) {
    const a = ADDRESSES[sor.config.chainId];

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
        // { tokenIn: a.TETU, tokenOut: a.cxETH, amount: 1000 },
        // { tokenIn: a.cxETH, tokenOut: a.TETU, amount: 10 }, // ? Unsupported ENS operation ?
        // TODO WMATIC, MATIC
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
swapExample(
    Network.POLYGON,
    PROVIDER_URLS[networkId],
    MULTIADDR[networkId],
    SOR_CONFIG[networkId],
    BALANCER_SUBGRAPH_URLS[networkId],
    UNISWAP_SUBGRAPHS[networkId],
    ADDRESSES[networkId].BAL,
    ADDRESSES[networkId].TETU,
    parseFixed('1000', 18),
    false
).then();
