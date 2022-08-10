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

export const DYSTOPIA_SUBGRAPH_URLS = {
    [Network.POLYGON]:
        'https://api.thegraph.com/subgraphs/name/dystopia-exchange/dystopia-v2',
};

// dexId (range 0-15) is used to show swap dex name on UI
let dexId = 0;

export const UNISWAP_SUBGRAPHS = {
    [Network.POLYGON]: [
        {
            name: 'TetuSwap',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/tetu-io/tetu-swap',
            swapFee: '0.001',
        },
        {
            name: 'SushiSwap',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/sushiswap/matic-exchange',
            swapFee: '0.003',
        },
        {
            name: 'QuickSwap',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap06',
            swapFee: '0.003',
        },

        {
            name: 'ApeSwap',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/apeswapfinance/dex-polygon',
            swapFee: '0.002',
        },
        {
            name: 'JetSwap',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/smartcookie0501/jetswap-subgraph-polygon',
            swapFee: '0.001',
        },
        {
            name: 'Polycat',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/polycatfi/polycat-finance-amm',
            swapFee: '0.024',
        },
        {
            name: 'RadioShack',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/radioshackcreator/radioshack-polygon',
            swapFee: '0.001',
        },
        {
            name: 'SafeSwap',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/yfdaifinance/safeswapmatic',
            swapFee: '0.003',
        },
        {
            name: 'WaultFinance',
            dexId: dexId++,
            url: 'https://api.thegraph.com/subgraphs/name/waultfinance/waultswap-polygon',
            swapFee: '0.002',
        },
    ],
};

// Fee on transfer tokens
export const FEE_ON_TRANSFER_TOKENS = {
    [Network.POLYGON]: [
        '0x62F594339830b90AE4C084aE7D223fFAFd9658A7'.toLowerCase(), // SPHERE
        '0x839F1a22A59eAAf26c85958712aB32F80FEA23d9'.toLowerCase(), // Axion
        '0xc08e94e12ca1357DF36F3c16c3A1df5F84c7B801'.toLowerCase(), // $GGWTT
        '0xA0D675533b237D9C1e1Ed3fBCA6b3BF726375ECb'.toLowerCase(), // SCORPIO
        '0xcd7361ac3307D1C5a46b63086a90742Ff44c63B3'.toLowerCase(), // RAIDER
        '0xCB898b0eFb084Df14dd8E018dA37B4d0f06aB26D'.toLowerCase(), // SING
        '0x1F3995854c486632f750530538F5f8Cd475C96f4'.toLowerCase(), // $AVTO
    ],
};

// Tokens with transfer disabled etc.
export const EXCLUDE_TOKENS = {
    [Network.POLYGON]: [
        '0x17e9c5b37283ac5fbe527011cec257b832f03eb3'.toLowerCase(), // trade off, old SPHERE token
        ...FEE_ON_TRANSFER_TOKENS[Network.POLYGON], // TODO remove when FEE_ON_TRANSFER_TOKENS will be implemented
    ],
};
