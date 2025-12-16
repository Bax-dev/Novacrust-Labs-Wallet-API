import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../models/entity/wallet.entity';
import { Transaction } from '../models/entity/transaction.entity';
import { TransactionType } from '../types/transaction.types';
import { roundToTwoDecimals, validateBalanceRange } from '../utils/balance-integrity.util';

@Injectable()
export class WalletRepository {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}

  async create(wallet: Partial<Wallet>): Promise<Wallet> {
    if (wallet.balance !== undefined) {
      wallet.balance = roundToTwoDecimals(Number(wallet.balance));
      if (!validateBalanceRange(wallet.balance)) {
        throw new Error('Initial balance out of valid range');
      }
      if (wallet.balance < 0) {
        throw new Error('Initial balance cannot be negative');
      }
    }
    
    const newWallet = this.walletRepository.create(wallet);
    return this.walletRepository.save(newWallet);
  }

  async createInitialTransaction(
    walletId: string,
    amount: number,
    currency: string,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      walletId,
      type: TransactionType.FUND,
      amount,
      description: `Initial wallet balance: ${amount} ${currency}`,
    });
    return this.transactionRepository.save(transaction);
  }

  async findById(id: string): Promise<Wallet | null> {
    return this.walletRepository.findOne({
      where: { id },
      relations: ['transactions'],
      order: {
        transactions: {
          createdAt: 'DESC',
        },
      },
    });
  }

  async updateBalance(
    walletId: string,
    amount: number,
    type: TransactionType,
    relatedWalletId?: string,
    description?: string,
  ): Promise<Wallet> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { id: walletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const currentBalance = Number(wallet.balance);
      const newBalance = roundToTwoDecimals(currentBalance + amount);

      if (!validateBalanceRange(newBalance)) {
        throw new Error('Balance out of valid range');
      }

      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      wallet.balance = newBalance;
      await queryRunner.manager.save(wallet);

      const transaction = this.transactionRepository.create({
        walletId,
        type,
        amount: Math.abs(amount),
        relatedWalletId,
        description,
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return wallet;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async transfer(
    senderWalletId: string,
    receiverWalletId: string,
    amount: number,
  ): Promise<{ sender: Wallet; receiver: Wallet }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const senderWallet = await queryRunner.manager.findOne(Wallet, {
        where: { id: senderWalletId },
        lock: { mode: 'pessimistic_write' },
      });

      const receiverWallet = await queryRunner.manager.findOne(Wallet, {
        where: { id: receiverWalletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!senderWallet) {
        throw new Error('Sender wallet not found');
      }

      if (!receiverWallet) {
        throw new Error('Receiver wallet not found');
      }

      if (senderWalletId === receiverWalletId) {
        throw new Error('Cannot transfer to the same wallet');
      }

      const senderCurrentBalance = Number(senderWallet.balance);
      const receiverCurrentBalance = Number(receiverWallet.balance);
      
      const senderNewBalance = roundToTwoDecimals(senderCurrentBalance - amount);
      const receiverNewBalance = roundToTwoDecimals(receiverCurrentBalance + amount);

      if (!validateBalanceRange(senderNewBalance)) {
        throw new Error('Sender balance out of valid range');
      }

      if (!validateBalanceRange(receiverNewBalance)) {
        throw new Error('Receiver balance out of valid range');
      }

      if (senderNewBalance < 0) {
        throw new Error('Insufficient balance');
      }

      senderWallet.balance = senderNewBalance;
      receiverWallet.balance = receiverNewBalance;

      await queryRunner.manager.save(senderWallet);
      await queryRunner.manager.save(receiverWallet);

      const senderTransaction = this.transactionRepository.create({
        walletId: senderWalletId,
        type: TransactionType.TRANSFER_OUT,
        amount,
        relatedWalletId: receiverWalletId,
        description: `Transfer to wallet ${receiverWalletId}`,
      });

      const receiverTransaction = this.transactionRepository.create({
        walletId: receiverWalletId,
        type: TransactionType.TRANSFER_IN,
        amount,
        relatedWalletId: senderWalletId,
        description: `Transfer from wallet ${senderWalletId}`,
      });

      await queryRunner.manager.save(senderTransaction);
      await queryRunner.manager.save(receiverTransaction);

      await queryRunner.commitTransaction();

      return { sender: senderWallet, receiver: receiverWallet };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async verifyBalanceIntegrity(walletId: string): Promise<{
    isValid: boolean;
    calculatedBalance: number;
    currentBalance: number;
    discrepancy: number;
  }> {
    const wallet = await this.findById(walletId);
    
    if (!wallet || !wallet.transactions) {
      throw new Error('Wallet not found or has no transactions');
    }

    const currentBalance = Number(wallet.balance);
    let calculatedBalance = 0;

    for (const transaction of wallet.transactions) {
      const amount = Number(transaction.amount);
      
      switch (transaction.type) {
        case TransactionType.FUND:
        case TransactionType.TRANSFER_IN:
          calculatedBalance += amount;
          break;
        case TransactionType.TRANSFER_OUT:
          calculatedBalance -= amount;
          break;
      }
    }

    calculatedBalance = roundToTwoDecimals(calculatedBalance);
    const discrepancy = Math.abs(currentBalance - calculatedBalance);
    const isValid = discrepancy < 0.01; 

    return {
      isValid,
      calculatedBalance,
      currentBalance,
      discrepancy,
    };
  }
}
