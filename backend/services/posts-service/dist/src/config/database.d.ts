import { QueryResult, QueryResultRow } from 'pg';
interface DatabaseConfig {
    isConnected: boolean;
    init(): Promise<void>;
    query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<{
        rows: T[];
        rowCount: number;
    }>;
    getClient(): Promise<{
        query: <T extends QueryResultRow = any>(text: string, params: any[]) => Promise<QueryResult<T>>;
        release: (err?: Error | boolean) => void;
    }>;
    end(): Promise<void>;
}
declare const config: DatabaseConfig;
export default config;
//# sourceMappingURL=database.d.ts.map