import { AddressZero } from '@ethersproject/constants';
import { Network } from '../api/config';

export const TOKENS = {
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
        DYST: {
            address: '0x39aB6574c289c3Ae4d88500eEc792AB5B947A5Eb'.toLowerCase(),
            decimals: 18,
            symbol: 'DYST',
        },
    },
};
