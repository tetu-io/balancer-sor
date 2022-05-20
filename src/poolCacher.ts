import cloneDeep from 'lodash.clonedeep';
import { PoolDataService, SubgraphPoolBase } from './types';

export class PoolCacher {
    private pools: SubgraphPoolBase[] = [];
    private _finishedFetching = false;
    private readonly poolDataServices: PoolDataService[];

    constructor(
        poolDataServiceOrServices: PoolDataService | PoolDataService[]
    ) {
        this.poolDataServices = Array.isArray(poolDataServiceOrServices)
            ? poolDataServiceOrServices
            : [poolDataServiceOrServices];
    }

    public get finishedFetching(): boolean {
        return this._finishedFetching;
    }

    public getPools(): SubgraphPoolBase[] {
        return cloneDeep(this.pools);
    }

    /*
     * Saves updated pools data to internal cache.
     */
    public async fetchPools(): Promise<boolean> {
        try {
            // fetch pools from all data services
            const poolsGetPoolsPromises = this.poolDataServices.map(
                (poolDataService) => poolDataService.getPools()
            );
            const poolsArrays = await Promise.all(poolsGetPoolsPromises);
            this.pools = poolsArrays.flat();
            this._finishedFetching = true;
            return true;
        } catch (err) {
            // On error clear all caches
            // TODO may be just inore errorus pools and build route with successful data
            this._finishedFetching = false;
            this.pools = [];
            // TODO I guess better throw an exception, than return 'false'
            throw new Error(`Error: fetchPools(): ${err.message}`);
            // return false;
        }
    }
}
