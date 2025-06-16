type QueryResult<T = any> = {
    rows: T[];
    rowCount: number;
    command: string;
    oid: number;
    fields: any[];
};
interface DatabaseConfig {
    isConnected: boolean;
    init(): Promise<void>;
    query<T = any>(text: string, params?: any[]): Promise<{
        rows: T[];
        rowCount: number;
    }>;
    getClient(): Promise<{
        query: (text: string, params: any[]) => Promise<QueryResult>;
        release: (err?: Error | boolean) => void;
    }>;
    end(): Promise<void>;
}
declare const config: DatabaseConfig;
export default config;
//# sourceMappingURL=database.d.ts.map