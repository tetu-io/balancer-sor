import { BigNumber, parseFixed } from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import { SwapInfo } from '../../src';
import * as api from '../api/api';
import { AddressZero, MaxUint256 } from '@ethersproject/constants';
import {
    BALANCER_SUBGRAPH_URLS,
    balancerVaultAddress,
    CONTRACT_UTILS,
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
import { TOKENS } from './tokenAddresses';

export async function swapExample(
    networkId: Network,
    providerUrl: string,
    multiAddress: string,
    contractUtilsAddress: string,
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

    await api.getTokens(sor, contractUtilsAddress);

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
        console.log(`Return Amount is 0. No swaps to execute.`);
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

    //// calling Tetu Multiswap2 contract
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

// $ TS_NODE_PROJECT='tsconfig.testing.json' ts-node ./test/testScripts/swapExample.ts
const networkId = Network.POLYGON;
swapExample(
    Network.POLYGON,
    PROVIDER_URLS[networkId],
    MULTIADDR[networkId],
    CONTRACT_UTILS[networkId],
    SOR_CONFIG[networkId],
    BALANCER_SUBGRAPH_URLS[networkId],
    UNISWAP_SUBGRAPHS[networkId],
    TOKENS[networkId].BAL,
    TOKENS[networkId].TETU,
    parseFixed('1000', 18),
    false
).then();
