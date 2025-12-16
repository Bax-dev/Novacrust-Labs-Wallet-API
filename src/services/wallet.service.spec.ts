import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletRepository } from '../repository/wallet.repository';
import { CreateWalletDto } from '../models/request/create-wallet.dto';
import { FundWalletDto } from '../models/request/fund-wallet.dto';
import { TransferWalletDto } from '../models/request/transfer-wallet.dto';
import { Wallet } from '../models/entity/wallet.entity';
import { TransactionType } from '../types/transaction.types';
import { idempotencyService } from '../utils/idempotency.util';

describe('WalletService', () => {
  let service: WalletService;
  let repository: jest.Mocked<WalletRepository>;

  const mockWallet: Wallet = {
    id: 'test-wallet-id',
    currency: 'USD',
    balance: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [],
  };

  const mockWalletRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    updateBalance: jest.fn(),
    transfer: jest.fn(),
    createInitialTransaction: jest.fn(),
    verifyBalanceIntegrity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: WalletRepository,
          useValue: mockWalletRepository,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    repository = module.get(WalletRepository);

    jest.clearAllMocks();
    idempotencyService.clear();
  });

  describe('createWallet', () => {
    it('should create a wallet with default values', async () => {
      const createDto: CreateWalletDto = {};
      const createdWallet = { ...mockWallet, balance: 0 };

      repository.create.mockResolvedValue(createdWallet);
      repository.findById.mockResolvedValue(createdWallet);

      const result = await service.createWallet(createDto);

      expect(repository.create).toHaveBeenCalledWith({
        currency: 'USD',
        balance: 0,
      });
      expect(result.currency).toBe('USD');
      expect(result.balance).toBe(0);
    });

    it('should create a wallet with initial balance', async () => {
      const createDto: CreateWalletDto = { currency: 'USD', balance: 50 };
      const createdWallet = { ...mockWallet, balance: 50 };

      repository.create.mockResolvedValue(createdWallet);
      repository.findById.mockResolvedValue({
        ...createdWallet,
        transactions: [],
      });

      const result = await service.createWallet(createDto);

      expect(repository.create).toHaveBeenCalledWith({
        currency: 'USD',
        balance: 50,
      });
      expect(repository.createInitialTransaction).toHaveBeenCalledWith(
        'test-wallet-id',
        50,
        'USD',
      );
      expect(result.balance).toBe(50);
    });
  });

  describe('fundWallet', () => {
    it('should fund a wallet successfully', async () => {
      const fundDto: FundWalletDto = { amount: 50 };
      const updatedWallet = { ...mockWallet, balance: 150 };

      repository.findById.mockResolvedValue(mockWallet);
      repository.updateBalance.mockResolvedValue(updatedWallet);

      const result = await service.fundWallet('test-wallet-id', fundDto);

      expect(repository.findById).toHaveBeenCalledWith('test-wallet-id');
      expect(repository.updateBalance).toHaveBeenCalledWith(
        'test-wallet-id',
        50,
        TransactionType.FUND,
        null,
        expect.any(String),
      );
      expect(result.balance).toBe(150);
    });

    it('should throw NotFoundException if wallet not found', async () => {
      const fundDto: FundWalletDto = { amount: 50 };

      repository.findById.mockResolvedValue(null);

      await expect(
        service.fundWallet('non-existent-id', fundDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return cached result for idempotent requests', async () => {
      const fundDto: FundWalletDto = { amount: 50 };
      const cachedResult = {
        id: 'test-wallet-id',
        currency: 'USD',
        balance: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const key = idempotencyService.generateFundKey('test-wallet-id', 50);
      idempotencyService.set(key, cachedResult);

      const result = await service.fundWallet('test-wallet-id', fundDto);

      expect(result).toEqual(cachedResult);
      expect(repository.updateBalance).not.toHaveBeenCalled();
    });
  });

  describe('transferBetweenWallets', () => {
    it('should transfer funds successfully', async () => {
      const transferDto: TransferWalletDto = {
        receiverWalletId: 'receiver-id',
        amount: 30,
      };
      const senderWallet = { ...mockWallet, balance: 100 };
      const receiverWallet = {
        ...mockWallet,
        id: 'receiver-id',
        balance: 50,
      };

      repository.findById
        .mockResolvedValueOnce(senderWallet)
        .mockResolvedValueOnce(receiverWallet);
      repository.transfer.mockResolvedValue({
        sender: { ...senderWallet, balance: 70 },
        receiver: { ...receiverWallet, balance: 80 },
      });

      const result = await service.transferBetweenWallets(
        'test-wallet-id',
        transferDto,
      );

      expect(repository.transfer).toHaveBeenCalledWith(
        'test-wallet-id',
        'receiver-id',
        30,
      );
      expect(result.sender.balance).toBe(70);
      expect(result.receiver.balance).toBe(80);
    });

    it('should throw NotFoundException if sender wallet not found', async () => {
      const transferDto: TransferWalletDto = {
        receiverWalletId: 'receiver-id',
        amount: 30,
      };

      repository.findById.mockResolvedValue(null);

      await expect(
        service.transferBetweenWallets('non-existent-id', transferDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const transferDto: TransferWalletDto = {
        receiverWalletId: 'receiver-id',
        amount: 200,
      };
      const senderWallet = { ...mockWallet, balance: 100 };

      repository.findById.mockResolvedValue(senderWallet);

      await expect(
        service.transferBetweenWallets('test-wallet-id', transferDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getWalletDetails', () => {
    it('should return wallet details with transactions', async () => {
      const walletWithTransactions = {
        ...mockWallet,
        transactions: [
          {
            id: 'tx-1',
            walletId: 'test-wallet-id',
            wallet: mockWallet,
            type: TransactionType.FUND,
            amount: 100,
            relatedWalletId: null,
            description: null,
            createdAt: new Date(),
          },
        ],
      };

      repository.findById.mockResolvedValue(walletWithTransactions);
      repository.verifyBalanceIntegrity.mockResolvedValue({
        isValid: true,
        calculatedBalance: 100,
        currentBalance: 100,
        discrepancy: 0,
      });

      const result = await service.getWalletDetails('test-wallet-id');

      expect(result.id).toBe('test-wallet-id');
      expect(result.transactions).toHaveLength(1);
    });

    it('should throw NotFoundException if wallet not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.getWalletDetails('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

