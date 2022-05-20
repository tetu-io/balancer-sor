import fetch from 'isomorphic-fetch';
import { PoolDataService, SubgraphPoolBase, SubgraphToken } from '../../src';
import { getOnChainBalances } from './onchainData';
import { Provider } from '@ethersproject/providers';
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
    protected readonly poolIdSuffix = 'fffffffffffffffffffffff';
    constructor(
        private readonly config: {
            chainId: number;
            multiAddress: string;
            vaultAddress: string;
            subgraphUrl: string;
            provider: Provider;
            onchain: boolean;
            dexId?: number;
            swapFee?: string;
        }
    ) {
        if (
            this.config.dexId &&
            (this.config.dexId < 0 || this.config.dexId > 15)
        )
            throw new Error('dexId out of bounds');
    }

    public async getPools(): Promise<SubgraphPoolBase[]> {
        const timeIdSubgraph =
            'getPools subgraph (uniswap) #' + this.config.dexId;
        console.time(timeIdSubgraph);
        const response = await fetch(this.config.subgraphUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: Query[this.config.chainId] }),
        });
        const { data } = await response.json();
        // transform uniswap subgraph data to SubgraphPoolBase
        const pools: SubgraphPoolBase[] = data.pairs.map((p) => {
            return {
                id:
                    p.id +
                    this.poolIdSuffix +
                    (this.config.dexId ? this.config.dexId.toString(16) : '0'),
                address: p.id,
                poolType: 'UniswapV2',
                swapFee: this.config.swapFee ?? '0.03', // TODO fetch for tetuswap onchain
                swapEnabled: true,
                totalShares: p.totalSupply,
                tokens: [
                    {
                        address: p.token0.id,
                        balance: p.reserve0,
                        decimals: p.token0.decimals,
                        // priceRate: string, // TODO ? looks like it is not used for weighted pools
                        weight: '0.5',
                    },
                    {
                        address: p.token1.id,
                        balance: p.reserve1,
                        decimals: p.token1.decimals,
                        // priceRate: string, // TODO ?
                        weight: '0.5',
                    },
                ],
                tokensList: [p.token0.id, p.token1.id],
                totalWeight: '1',
            };
        });
        console.timeEnd(timeIdSubgraph);

        const timeIdOnchain =
            'getPools onchain (uniswap) #' + this.config.dexId;
        console.time(timeIdOnchain);
        // TODO !!! getOnChainBalances Uniswap V2
        // if (this.config.onchain) {
        //     return getOnChainBalances(
        //         data.pools ?? [],
        //         this.config.multiAddress,
        //         this.config.vaultAddress,
        //         this.config.provider
        //     );
        // }
        console.timeEnd(timeIdOnchain);

        return pools ?? [];
    }
}
