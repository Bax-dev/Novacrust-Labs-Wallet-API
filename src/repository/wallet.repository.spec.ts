import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { WalletRepository } from './wallet.repository';
import { Wallet } from '../models/entity/wallet.entity';
import { Transaction } from '../models/entity/transaction.entity';
import { TransactionType } from '../types/transaction.types';

describe('WalletRepository', () => {
  let repository: WalletRepository;
  let walletRepo: jest.Mocked<Repository<Wallet>>;
  let transactionRepo: jest.Mocked<Repository<Transaction>>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: jest.Mocked<QueryRunner>;
  let managerFindOne: jest.Mock;
  let managerSave: jest.Mock;

  const mockWallet: Wallet = {
    id: 'test-wallet-id',
    currency: 'USD',
    balance: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [],
  };

  beforeEach(async () => {
    managerFindOne = jest.fn();
    managerSave = jest.fn();
    
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: managerFindOne,
        save: managerSave,
      } as any,
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletRepository,
        {
          provide: getRepositoryToken(Wallet),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => queryRunner),
          },
        },
      ],
    }).compile();

    repository = module.get<WalletRepository>(WalletRepository);
    walletRepo = module.get(getRepositoryToken(Wallet));
    transactionRepo = module.get(getRepositoryToken(Transaction));
    dataSource = module.get(DataSource);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a wallet', async () => {
      const walletData = { currency: 'USD', balance: 0 };
      const createdWallet = { ...mockWallet, ...walletData };

      walletRepo.create.mockReturnValue(createdWallet as Wallet);
      walletRepo.save.mockResolvedValue(createdWallet as Wallet);

      const result = await repository.create(walletData);

      expect(walletRepo.create).toHaveBeenCalledWith(walletData);
      expect(walletRepo.save).toHaveBeenCalledWith(createdWallet);
      expect(result).toEqual(createdWallet);
    });

    it('should validate and round balance', async () => {
      const walletData = { currency: 'USD', balance: 100.999 };
      const createdWallet = { ...mockWallet, balance: 101 };

      walletRepo.create.mockReturnValue(createdWallet as Wallet);
      walletRepo.save.mockResolvedValue(createdWallet as Wallet);

      await repository.create(walletData);

      expect(walletRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 101,
        }),
      );
    });
  });

  describe('updateBalance', () => {
    it('should update wallet balance successfully', async () => {
      const wallet = { ...mockWallet, balance: 100 };
      const updatedWallet = { ...wallet, balance: 150 };
      const transaction = {
        id: 'tx-1',
        walletId: 'test-wallet-id',
        type: TransactionType.FUND,
        amount: 50,
        createdAt: new Date(),
      };

      managerFindOne.mockResolvedValue(wallet);
      managerSave
        .mockResolvedValueOnce(updatedWallet)
        .mockResolvedValueOnce(transaction);

      transactionRepo.create.mockReturnValue(transaction as Transaction);

      const result = await repository.updateBalance(
        'test-wallet-id',
        50,
        TransactionType.FUND,
      );

      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(managerFindOne).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.balance).toBe(150);
    });

    it('should throw error for insufficient balance', async () => {
      const wallet = { ...mockWallet, balance: 50 };

      managerFindOne.mockResolvedValue(wallet);

      await expect(
        repository.updateBalance('test-wallet-id', -100, TransactionType.FUND),
      ).rejects.toThrow('Insufficient balance');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('transfer', () => {
    it('should transfer funds between wallets', async () => {
      const senderWallet = { ...mockWallet, balance: 100 };
      const receiverWallet = {
        ...mockWallet,
        id: 'receiver-id',
        balance: 50,
      };

      managerFindOne
        .mockResolvedValueOnce(senderWallet)
        .mockResolvedValueOnce(receiverWallet);

      const updatedSender = { ...senderWallet, balance: 70 };
      const updatedReceiver = { ...receiverWallet, balance: 80 };

      managerSave
        .mockResolvedValueOnce(updatedSender)
        .mockResolvedValueOnce(updatedReceiver)
        .mockResolvedValueOnce({} as Transaction)
        .mockResolvedValueOnce({} as Transaction);

      transactionRepo.create.mockReturnValue({} as Transaction);

      const result = await repository.transfer(
        'sender-id',
        'receiver-id',
        30,
      );

      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(result.sender.balance).toBe(70);
      expect(result.receiver.balance).toBe(80);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw error for same wallet transfer', async () => {
      const wallet = { ...mockWallet, balance: 100 };

      managerFindOne
        .mockResolvedValueOnce(wallet)
        .mockResolvedValueOnce(wallet);

      await expect(
        repository.transfer('test-wallet-id', 'test-wallet-id', 30),
      ).rejects.toThrow('Cannot transfer to the same wallet');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});

