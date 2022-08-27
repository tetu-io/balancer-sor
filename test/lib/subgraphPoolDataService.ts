import fetch from 'isomorphic-fetch';
import { PoolDataService, SubgraphPoolBase } from '../../src';
import { getOnChainBalances } from './onchainData';
import { Provider } from '@ethersproject/providers';
import { wait } from '../../src/utils/tools';

const queryWithLinear = `
      {
        pool0: pools(
          first: 1000,
          where: { swapEnabled: true, totalShares_gt: "0" },
          orderBy: totalLiquidity,
          orderDirection: desc
        ) {
          id
          address
          poolType
          swapFee
          totalShares
          tokens {
            address
            balance
            decimals
            weight
            priceRate
          }
          tokensList
          totalWeight
          amp
          expiryTime
          unitSeconds
          principalToken
          baseToken
          swapEnabled
          wrappedIndex
          mainIndex
          lowerTarget
          upperTarget
        }
        pool1000: pools(
          first: 1000,
          skip: 1000,
          where: { swapEnabled: true, totalShares_gt: "0" },
          orderBy: totalLiquidity,
          orderDirection: desc
        ) {
          id
          address
          poolType
          swapFee
          totalShares
          tokens {
            address
            balance
            decimals
            weight
            priceRate
          }
          tokensList
          totalWeight
          amp
          expiryTime
          unitSeconds
          principalToken
          baseToken
          swapEnabled
          wrappedIndex
          mainIndex
          lowerTarget
          upperTarget
        }
      }
    `;

const queryWithOutLinear = `
      {
        pool0: pools(
          first: 1000,
          where: { swapEnabled: true, totalShares_gt: "0" },
          orderBy: totalLiquidity,
          orderDirection: desc
        ) {
          id
          address
          poolType
          swapFee
          totalShares
          tokens {
            address
            balance
            decimals
            weight
            priceRate
          }
          tokensList
          totalWeight
          amp
          expiryTime
          unitSeconds
          principalToken
          baseToken
          swapEnabled
        }
        pool1000: pools(
          first: 1000,
          skip: 1000,
          where: { swapEnabled: true, totalShares_gt: "0" },
          orderBy: totalLiquidity,
          orderDirection: desc
        ) {
          id
          address
          poolType
          swapFee
          totalShares
          tokens {
            address
            balance
            decimals
            weight
            priceRate
          }
          tokensList
          totalWeight
          amp
          expiryTime
          unitSeconds
          principalToken
          baseToken
          swapEnabled
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

export class SubgraphPoolDataService implements PoolDataService {
    public readonly dexType = 'Balancer';

    constructor(
        private readonly config: {
            chainId: number;
            multiAddress: string;
            vaultAddress: string;
            subgraphUrl: string;
            provider: Provider;
            onchain: boolean;
        },
        public readonly name?: string
    ) {}

    public async getPools(): Promise<SubgraphPoolBase[]> {
        const timeIdSubgraph = 'Subgraph getPools (balancer)';

        let pools,
            data,
            tries = 0;
        do {
            console.time(timeIdSubgraph);
            try {
                const response = await fetch(this.config.subgraphUrl, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: Query[this.config.chainId] }),
                });

                const json = await response.json();
                data = json.data;
                pools = [...data.pool0, ...data.pool1000];
            } catch (e) {
                await wait(2000);
            } finally {
                console.timeEnd(timeIdSubgraph);
                tries++;
            }
        } while (!data && tries < 5);

        // fill platform to all pools
        for (const pool of pools) pool.platform = this.name;

        if (this.config.onchain) {
            const timeIdOnchain = 'On chain getPools (balancer)';
            console.time(timeIdOnchain);
            const balances = await getOnChainBalances(
                pools ?? [],
                this.config.multiAddress,
                this.config.vaultAddress,
                this.config.provider
            );
            console.timeEnd(timeIdOnchain);
            return balances;
        }

        return data.pools ?? [];
    }
}
