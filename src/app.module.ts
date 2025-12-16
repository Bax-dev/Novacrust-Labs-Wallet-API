import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { Wallet } from './models/entity/wallet.entity';
import { Transaction } from './models/entity/transaction.entity';
import { WalletController } from './controllers/wallet.controller';
import { WalletService } from './services/wallet.service';
import { WalletRepository } from './repository/wallet.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        const { createDatabaseIfNotExists } = await import(
          './utils/database-init.util'
        );
        await createDatabaseIfNotExists();
        return databaseConfig();
      },
    }),
    TypeOrmModule.forFeature([Wallet, Transaction]),
  ],
  controllers: [WalletController],
  providers: [WalletService, WalletRepository],
})
export class AppModule {}
