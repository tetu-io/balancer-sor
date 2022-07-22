import cloneDeep from 'lodash.clonedeep';
import { PoolDataService, SubgraphPoolBase } from './types';
import { wait } from './utils/tools';

export class PoolCacher {
    private pools: SubgraphPoolBase[] = [];
    private _fetchingInProgress = false;
    private readonly poolDataServices: PoolDataService[];

    constructor(
        poolDataServiceOrServices: PoolDataService | PoolDataService[]
    ) {
        this.poolDataServices = Array.isArray(poolDataServiceOrServices)
            ? poolDataServiceOrServices
            : [poolDataServiceOrServices];
    }

    public havePools(): boolean {
        return this.pools.length > 0;
    }

    public getPools(): SubgraphPoolBase[] {
        return cloneDeep(this.pools);
    }

    /*
     * Saves updated pools data to internal cache.
     */
    public async fetchPools(): Promise<boolean> {
        if (this._fetchingInProgress) return true;
        this._fetchingInProgress = true;

        try {
            // fetch pools from all data services
            const poolsGetPoolsPromises = this.poolDataServices.map(
                async (poolDataService) => {
                    let pools: SubgraphPoolBase[] = [],
                        success = false,
                        tries = 0;
                    // sometimes Balancer getPool returns error and []
                    // lets repeat
                    do {
                        try {
                            tries++;
                            pools = await poolDataService.getPools();
                            success = true;
                        } catch (e) {
                            console.warn(
                                `Error #${tries} ${poolDataService.name}.getPools():`,
                                e
                            );
                            await wait(2000);
                        }
                    } while (!success && tries < 5); // repeat until success
                    return pools;
                }
            );
            const poolsArrays = await Promise.all(poolsGetPoolsPromises); // TODO Promise.allSettled ?
            this.pools = poolsArrays.flat();
            this._fetchingInProgress = false;
            return true;
        } catch (err) {
            this.pools = [];
            this._fetchingInProgress = false;
            return false;
        } finally {
            this._fetchingInProgress = false;
        }
    }
}
