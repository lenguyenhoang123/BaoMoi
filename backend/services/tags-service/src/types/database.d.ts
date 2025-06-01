import { Pool } from 'pg';

declare module 'db' {
  const db: {
    getInstance: () => Pool;
  };
  export default db;
}
