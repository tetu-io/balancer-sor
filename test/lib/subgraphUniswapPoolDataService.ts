import fetch from 'isomorphic-fetch';
import { Provider } from '@ethersproject/providers';
import { PoolDataService, SubgraphPoolBase } from '../../src';
import { getOnChainBalancesUniswap } from './onchainDataUniswap';
const queryWithLinear = `
{
  pairs: pairs(
    first: 1000,
    orderBy:reserveETH,
    orderDirection: desc
  ) {
    id,
    reserveETH,
    totalSupply,
    reserve0,
    reserve1,
    token0 {
      id,
      decimals
    },
    token1 {
      id,
      decimals
    }
  }
}
`;

export const Query: { [chainId: number]: string } = {
    1: queryWithLinear,
    3: queryWithLinear,
    4: queryWithLinear,
    5: queryWithLinear,
    42: queryWithLinear,
    137: queryWithLinear,
    42161: queryWithLinear,
};

export class SubgraphUniswapPoolDataService implements PoolDataService {
    // This constant is added to pool address to generate bytes32 balancer-like pool id
    // so Swapper contract can detect what it is Uniswap V2 pool and call its swap function
    // format: [pool address][poolIdSuffix][dexId:4bit]
    // noinspection JSStringConcatenationToES6Template,SpellCheckingInspection
    protected readonly poolIdSuffix = 'fffffffffffffffffffffff';
    public readonly poolIdMask =
        '0x0000000000000000000000000000000000000000fffffffffffffffffffffff0'; // last half-byte - index of uniswap dex
    public readonly dexType = 'UniswapV2';
    constructor(
        public readonly config: {
            chainId: number;
            multiAddress: string;
            subgraphUrl: string;
            provider: Provider;
            onchain: boolean;
            swapFee?: string;
        },
        public readonly name: string,
        public readonly dexId: number
    ) {
        if (this.dexId && (this.dexId < 0 || this.dexId > 15))
            throw new Error('dexId out of bounds');
    }

    public async getPools(): Promise<SubgraphPoolBase[]> {
        const timeId = `getPools (uniswap) #${this.dexId} ${this.name}`;
        const timeIdSubgraph = 'Subgraph ' + timeId;
        console.time(timeIdSubgraph);
        const response = await fetch(this.config.subgraphUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: Query[this.config.chainId] }),
        });

        const json = await response.json();

        if (!json.data) {
            console.error('getPools() No data in response', json);
            return [];
        }

        const { data } = json;
        // transform uniswap subgraph data to SubgraphPoolBase
        const pools: SubgraphPoolBase[] = data.pairs.map((pool) => {
            return {
                id:
                    pool.id +
                    this.poolIdSuffix +
                    (this.dexId ? this.dexId.toString(16) : '0'),
                address: pool.id,
                poolType: 'UniswapV2',
                swapFee: this.config.swapFee ?? '0.03',
                swapEnabled: true,
                totalShares: pool.totalSupply,
                tokens: [
                    {
                        address: pool.token0.id,
                        balance: pool.reserve0,
                        decimals: pool.token0.decimals,
                    },
                    {
                        address: pool.token1.id,
                        balance: pool.reserve1,
                        decimals: pool.token1.decimals,
                    },
                ],
                tokensList: [pool.token0.id, pool.token1.id],
                totalWeight: '1',
            };
        });
        console.timeEnd(timeIdSubgraph);

        for (const pool of pools) pool.platform = this.name;

        if (this.config.onchain) {
            const timeIdOnchain = 'On chain ' + timeId;
            console.time(timeIdOnchain);
            const onchainBalances = await getOnChainBalancesUniswap(
                pools ?? [],
                this.config.multiAddress,
                this.config.provider
            );
            console.timeEnd(timeIdOnchain);
            return onchainBalances;
        }

        return pools ?? [];
    }
}
