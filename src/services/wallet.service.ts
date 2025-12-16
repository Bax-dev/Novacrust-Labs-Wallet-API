import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WalletRepository } from '../repository/wallet.repository';
import { Wallet } from '../models/entity/wallet.entity';
import { TransactionType } from '../types/transaction.types';
import { CreateWalletDto } from '../models/request/create-wallet.dto';
import { FundWalletDto } from '../models/request/fund-wallet.dto';
import { TransferWalletDto } from '../models/request/transfer-wallet.dto';
import { WalletResponseDto } from '../models/response/wallet-response.dto';
import { TransactionResponseDto } from '../models/response/transaction-response.dto';
import { idempotencyService } from '../utils/idempotency.util';

@Injectable()
export class WalletService {
  constructor(private readonly walletRepository: WalletRepository) {}

  async createWallet(createWalletDto: CreateWalletDto): Promise<WalletResponseDto> {
    const initialBalance = createWalletDto.balance || 0;
    const currency = createWalletDto.currency || 'USD';

    const wallet = await this.walletRepository.create({
      currency,
      balance: initialBalance,
    });

    if (initialBalance > 0) {
      await this.walletRepository.createInitialTransaction(
        wallet.id,
        initialBalance,
        currency,
      );
    }

    const walletWithTransaction = await this.walletRepository.findById(wallet.id);

    return this.mapToWalletResponse(walletWithTransaction || wallet);
  }

  async fundWallet(
    walletId: string,
    fundWalletDto: FundWalletDto,
  ): Promise<WalletResponseDto> {
    const idempotencyKey = idempotencyService.generateFundKey(
      walletId,
      fundWalletDto.amount,
    );

    const cachedResult = idempotencyService.get<WalletResponseDto>(
      idempotencyKey,
    );
    if (cachedResult) {
      return cachedResult;
    }

    const wallet = await this.walletRepository.findById(walletId);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const updatedWallet = await this.walletRepository.updateBalance(
      walletId,
      fundWalletDto.amount,
      TransactionType.FUND,
      null,
      `Fund wallet with ${fundWalletDto.amount} ${wallet.currency}`,
    );

    const result = this.mapToWalletResponse(updatedWallet);

    idempotencyService.set(idempotencyKey, result);

    return result;
  }

  async transferBetweenWallets(
    senderWalletId: string,
    transferWalletDto: TransferWalletDto,
  ): Promise<{ sender: WalletResponseDto; receiver: WalletResponseDto }> {
    const idempotencyKey = idempotencyService.generateTransferKey(
      senderWalletId,
      transferWalletDto.receiverWalletId,
      transferWalletDto.amount,
    );

    const cachedResult = idempotencyService.get<{
      sender: WalletResponseDto;
      receiver: WalletResponseDto;
    }>(idempotencyKey);
    if (cachedResult) {
      return cachedResult;
    }

    const senderWallet = await this.walletRepository.findById(senderWalletId);

    if (!senderWallet) {
      throw new NotFoundException('Sender wallet not found');
    }

    const receiverWallet = await this.walletRepository.findById(
      transferWalletDto.receiverWalletId,
    );

    if (!receiverWallet) {
      throw new NotFoundException('Receiver wallet not found');
    }

    if (Number(senderWallet.balance) < transferWalletDto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    try {
      const result = await this.walletRepository.transfer(
        senderWalletId,
        transferWalletDto.receiverWalletId,
        transferWalletDto.amount,
      );

      const response = {
        sender: this.mapToWalletResponse(result.sender),
        receiver: this.mapToWalletResponse(result.receiver),
      };

      idempotencyService.set(idempotencyKey, response);

      return response;
    } catch (error) {
      if (error.message === 'Insufficient balance') {
        throw new BadRequestException('Insufficient balance');
      }
      if (error.message === 'Sender wallet not found') {
        throw new NotFoundException('Sender wallet not found');
      }
      if (error.message === 'Receiver wallet not found') {
        throw new NotFoundException('Receiver wallet not found');
      }
      if (error.message === 'Cannot transfer to the same wallet') {
        throw new BadRequestException('Cannot transfer to the same wallet');
      }
      throw error;
    }
  }

  async getWalletDetails(walletId: string): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.findById(walletId);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    try {
      const integrityCheck = await this.walletRepository.verifyBalanceIntegrity(
        walletId,
      );
      if (!integrityCheck.isValid) {
        console.warn(
          ` Balance integrity issue detected for wallet ${walletId}: ` +
            `Current: ${integrityCheck.currentBalance}, ` +
            `Calculated: ${integrityCheck.calculatedBalance}, ` +
            `Discrepancy: ${integrityCheck.discrepancy}`,
        );
      }
    } catch (error) {
      console.error(`Error verifying balance integrity: ${error.message}`);
    }

    return this.mapToWalletResponse(wallet, true);
  }

  async verifyBalanceIntegrity(walletId: string): Promise<{
    isValid: boolean;
    calculatedBalance: number;
    currentBalance: number;
    discrepancy: number;
  }> {
    const wallet = await this.walletRepository.findById(walletId);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return this.walletRepository.verifyBalanceIntegrity(walletId);
  }

  private mapToWalletResponse(
    wallet: Wallet,
    includeTransactions = false,
  ): WalletResponseDto {
    const response: WalletResponseDto = {
      id: wallet.id,
      currency: wallet.currency,
      balance: Number(wallet.balance),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };

    if (includeTransactions && wallet.transactions) {
      response.transactions = wallet.transactions.map(
        (transaction): TransactionResponseDto => ({
          id: transaction.id,
          walletId: transaction.walletId,
          type: transaction.type,
          amount: Number(transaction.amount),
          relatedWalletId: transaction.relatedWalletId || undefined,
          description: transaction.description || undefined,
          createdAt: transaction.createdAt,
        }),
      );
    }

    return response;
  }
}
