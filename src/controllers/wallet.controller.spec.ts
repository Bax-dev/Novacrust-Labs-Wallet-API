import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from '../services/wallet.service';
import { CreateWalletDto } from '../models/request/create-wallet.dto';
import { FundWalletDto } from '../models/request/fund-wallet.dto';
import { TransferWalletDto } from '../models/request/transfer-wallet.dto';

describe('WalletController', () => {
  let controller: WalletController;
  let service: jest.Mocked<WalletService>;

  const mockWalletService = {
    createWallet: jest.fn(),
    fundWallet: jest.fn(),
    transferBetweenWallets: jest.fn(),
    getWalletDetails: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
      ],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    service = module.get(WalletService);

    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    it('should create a wallet', async () => {
      const createDto: CreateWalletDto = { currency: 'USD' };
      const walletResponse = {
        id: 'test-id',
        currency: 'USD',
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.createWallet.mockResolvedValue(walletResponse);

      const result = await controller.createWallet(createDto);

      expect(service.createWallet).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(walletResponse);
    });
  });

  describe('fundWallet', () => {
    it('should fund a wallet', async () => {
      const fundDto: FundWalletDto = { amount: 50 };
      const walletResponse = {
        id: 'test-id',
        currency: 'USD',
        balance: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.fundWallet.mockResolvedValue(walletResponse);

      const result = await controller.fundWallet('test-id', fundDto);

      expect(service.fundWallet).toHaveBeenCalledWith('test-id', fundDto);
      expect(result).toEqual(walletResponse);
    });
  });

  describe('transferBetweenWallets', () => {
    it('should transfer funds between wallets', async () => {
      const transferDto: TransferWalletDto = {
        receiverWalletId: 'receiver-id',
        amount: 30,
      };
      const transferResponse = {
        sender: {
          id: 'sender-id',
          currency: 'USD',
          balance: 70,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        receiver: {
          id: 'receiver-id',
          currency: 'USD',
          balance: 80,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      service.transferBetweenWallets.mockResolvedValue(transferResponse);

      const result = await controller.transferBetweenWallets(
        'sender-id',
        transferDto,
      );

      expect(service.transferBetweenWallets).toHaveBeenCalledWith(
        'sender-id',
        transferDto,
      );
      expect(result).toEqual(transferResponse);
    });
  });

  describe('getWalletDetails', () => {
    it('should get wallet details', async () => {
      const walletResponse = {
        id: 'test-id',
        currency: 'USD',
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        transactions: [],
      };

      service.getWalletDetails.mockResolvedValue(walletResponse);

      const result = await controller.getWalletDetails('test-id');

      expect(service.getWalletDetails).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(walletResponse);
    });
  });
});

