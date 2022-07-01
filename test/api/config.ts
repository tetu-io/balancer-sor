// import { Network } from './api';
import { SorConfig } from '../../src';
import 'dotenv/config';

export enum Network {
    POLYGON = 137,
    // MAINNET = 1,
    // GOERLI = 5,
    // KOVAN = 42,
    // ARBITRUM = 42161,
    // FANTOM = 250
}

// This is the same across networks
export const balancerVaultAddress =
    '0xBA12222222228d8Ba445958a75a0704d566BF2C8';

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

export const MULTIADDR = {
    [Network.POLYGON]: '0xa1B2b503959aedD81512C37e9dce48164ec6a94d',
};

export const CONTRACT_UTILS = {
    [Network.POLYGON]: '0xd933B5943B82806C638df8c0C88dC0930Dd13bE4',
};

export const BALANCER_SUBGRAPH_URLS = {
    [Network.POLYGON]:
        'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-polygon-v2',
};

// dexId (range 0-15) is used to show swap dex name on UI
let dexId = 0;

export const UNISWAP_SUBGRAPHS = {
    [Network.POLYGON]: [
        {
            name: 'TetuSwap',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/tetu-io/tetu-swap',
            swapFee: '0.01',
        },
        {
            name: 'SushiSwap',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/sushiswap/matic-exchange',
            swapFee: '0.03',
        },
        {
            name: 'QuickSwap',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap06',
            swapFee: '0.03',
        },
        /*        {
            name: 'ApeSwap',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/apeswapfinance/dex-polygon',
            swapFee: '0.02',

        },
        {
            name: 'JetSwap',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/smartcookie0501/jetswap-subgraph-polygon',
            swapFee: '0.01',

        },
        {
            name: 'Polycat',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/polycatfi/polycat-finance-amm',
            swapFee: '0.24',
        },
        {
            name: 'RadioShack',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/radioshackcreator/radioshack-polygon',
            swapFee: '0.01',
        },
        {
            name: 'SafeSwap',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/yfdaifinance/safeswapmatic',
            swapFee: '0.03',
        },
        {
            name: 'WaultFinance',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/waultfinance/waultswap-polygon',
            swapFee: '0.02',
        },*/
    ],
};
