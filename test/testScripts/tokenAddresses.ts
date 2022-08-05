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

        'USD+': {
            address: '0x236eeC6359fb44CCe8f97E99387aa7F8cd5cdE1f'.toLowerCase(),
            decimals: 6,
            symbol: 'USD+',
        },
        USDT: {
            address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'.toLowerCase(),
            decimals: 6,
            symbol: 'USDT',
        },
        SPHERE: {
            address: '0x62F594339830b90AE4C084aE7D223fFAFd9658A7'.toLowerCase(),
            decimals: 18,
            symbol: 'SPHERE',
        },
        stMATIC: {
            address: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4'.toLowerCase(),
            decimals: 18,
            symbol: 'stMATIC',
        },
        FRAX: {
            address: '0x45c32fA6DF82ead1e2EF74d17b76547EDdFaFF89'.toLowerCase(),
            decimals: 18,
            symbol: 'FRAX',
        },
        DYST: {
            address: '0x39aB6574c289c3Ae4d88500eEc792AB5B947A5Eb'.toLowerCase(),
            decimals: 18,
            symbol: 'DYST',
        },
        PEN: {
            address: '0x9008D70A5282a936552593f410AbcBcE2F891A97'.toLowerCase(),
            decimals: 18,
            symbol: 'PEN',
        },
        TUSD: {
            address: '0x2e1AD108fF1D8C782fcBbB89AAd783aC49586756'.toLowerCase(),
            decimals: 18,
            symbol: 'TUSD',
        },
        MaticX: {
            address: '0xfa68FB4628DFF1028CFEc22b4162FCcd0d45efb6'.toLowerCase(),
            decimals: 18,
            symbol: 'MaticX',
        },
        CLAM: {
            address: '0xC250e9987A032ACAC293d838726C511E6E1C029d'.toLowerCase(),
            decimals: 9,
            symbol: 'CLAM',
        },
        miMATIC: {
            address: '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1'.toLowerCase(),
            decimals: 18,
            symbol: 'miMATIC',
        },
        Qi: {
            address: '0x580A84C73811E1839F75d86d75d88cCa0c241fF4'.toLowerCase(),
            decimals: 18,
            symbol: 'Qi',
        },
        vQi: {
            address: '0xB424dfDf817FaF38FF7acF6F2eFd2f2a843d1ACA'.toLowerCase(),
            decimals: 18,
            symbol: 'vQi',
        },
        FXS: {
            address: '0x3e121107F6F22DA4911079845a470757aF4e1A1b'.toLowerCase(),
            decimals: 18,
            symbol: 'FXS',
        },
        tetuQi: {
            address: '0x4Cd44ced63d9a6FEF595f6AD3F7CED13fCEAc768'.toLowerCase(),
            decimals: 18,
            symbol: 'tetuQi',
        },
        KOGECOIN: {
            address: '0x13748d548D95D78a3c83fe3F32604B4796CFfa23'.toLowerCase(),
            decimals: 9,
            symbol: 'KOGECOIN',
        },
        SYN: {
            address: '0xf8F9efC0db77d8881500bb06FF5D6ABc3070E695'.toLowerCase(),
            decimals: 18,
            symbol: 'SYN',
        },
        COMFI: {
            address: '0x72bba3Aa59a1cCB1591D7CDDB714d8e4D5597E96'.toLowerCase(),
            decimals: 18,
            symbol: 'COMFI',
        },
    },
};
