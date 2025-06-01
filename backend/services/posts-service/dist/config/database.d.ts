import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
interface DatabaseConfig {
    isConnected: boolean;
    init(): Promise<void>;
    initPostgreSQL(): Promise<Pool | null>;
    query<T extends QueryResultRow>(text: string, params?: any[], callback?: (err: Error, result: QueryResult<T>) => void): Promise<QueryResult<T>>;
    getClient(): Promise<PoolClient>;
    end(): Promise<void>;
}
declare const config: DatabaseConfig;
export default config;
//# sourceMappingURL=database.d.ts.map