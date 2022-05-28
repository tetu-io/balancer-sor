import { formatFixed } from '@ethersproject/bignumber';
import { Provider } from '@ethersproject/providers';

import pairAbi from '../../src/pools/uniswapV2Pool/uniswapV2PoolAbi.json';
import { SubgraphPoolBase } from '../../src';
import { Multicaller } from './multicaller';

type OnchainRecord = Record<
    string,
    {
        reserves: string[];
    }
>;

export async function getOnChainBalancesUniswap(
    subgraphPools: SubgraphPoolBase[],
    multiAddress: string,
    provider: Provider
): Promise<SubgraphPoolBase[]> {
    if (subgraphPools.length === 0) return subgraphPools;

    const uniswapPair = new Multicaller(multiAddress, provider, pairAbi);

    subgraphPools.forEach((pool) => {
        if (pool.poolType !== 'UniswapV2')
            throw new Error(
                `Pool type must be UniswapV2: ${pool.poolType} ${pool.id}`
            );

        uniswapPair.call(`${pool.id}.reserves`, pool.address, 'getReserves');
    });

    let pairs = {} as OnchainRecord;

    try {
        pairs = (await uniswapPair.execute()) as OnchainRecord;
    } catch (err) {
        throw `Issue with multicall execution (uniswap): ` + err.toString();
    }

    // const onChainPools: SubgraphPoolBase[] = { ...subgraphPools };
    const onChainPools = subgraphPools;
    for (const pool of onChainPools) {
        const pair = pairs[pool.id];
        const reserve0 = formatFixed(
            pair.reserves[0].toString(),
            pool.tokens[0].decimals
        );
        const reserve1 = formatFixed(
            pair.reserves[1].toString(),
            pool.tokens[1].decimals
        );

        pool.tokens[0].balance = reserve0;
        pool.tokens[1].balance = reserve1;
    }

    return onChainPools;
}
