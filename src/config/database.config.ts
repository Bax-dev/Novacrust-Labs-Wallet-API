import { DataSourceOptions } from 'typeorm';
import { Wallet } from '../models/entity/wallet.entity';
import { Transaction } from '../models/entity/transaction.entity';

export const databaseConfig = (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'wallet_db',
  entities: [Wallet, Transaction],
  synchronize: process.env.NODE_ENV !== 'production',
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true,
  logging: false,
});
