import {
  verifyBalanceIntegrity,
  roundToTwoDecimals,
  validateBalanceRange,
} from './balance-integrity.util';
import { Wallet } from '../models/entity/wallet.entity';
import { Transaction } from '../models/entity/transaction.entity';
import { TransactionType } from '../types/transaction.types';

describe('BalanceIntegrityUtil', () => {
  describe('roundToTwoDecimals', () => {
    it('should round to 2 decimal places', () => {
      expect(roundToTwoDecimals(100.999)).toBe(101);
      expect(roundToTwoDecimals(100.123)).toBe(100.12);
      expect(roundToTwoDecimals(100.456)).toBe(100.46);
    });
  });

  describe('validateBalanceRange', () => {
    it('should validate balance within range', () => {
      expect(validateBalanceRange(0)).toBe(true);
      expect(validateBalanceRange(100)).toBe(true);
      expect(validateBalanceRange(999999999.99)).toBe(true);
      expect(validateBalanceRange(-1)).toBe(false);
      expect(validateBalanceRange(1000000000)).toBe(false);
    });
  });

  describe('verifyBalanceIntegrity', () => {
    const mockWallet: Wallet = {
      id: 'test-id',
      currency: 'USD',
      balance: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
    };

    it('should verify correct balance', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          walletId: 'test-id',
          type: TransactionType.FUND,
          amount: 100,
          relatedWalletId: null,
          description: null,
          createdAt: new Date(),
        } as Transaction,
      ];

      const result = verifyBalanceIntegrity(mockWallet, transactions);

      expect(result.isValid).toBe(true);
      expect(result.calculatedBalance).toBe(100);
      expect(result.currentBalance).toBe(100);
      expect(result.discrepancy).toBe(0);
    });

    it('should detect balance discrepancy', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          walletId: 'test-id',
          type: TransactionType.FUND,
          amount: 50,
          relatedWalletId: null,
          description: null,
          createdAt: new Date(),
        } as Transaction,
      ];

      const result = verifyBalanceIntegrity(mockWallet, transactions);

      expect(result.isValid).toBe(false);
      expect(result.calculatedBalance).toBe(50);
      expect(result.currentBalance).toBe(100);
      expect(result.discrepancy).toBe(50);
    });

    it('should handle multiple transactions', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          walletId: 'test-id',
          type: TransactionType.FUND,
          amount: 100,
          relatedWalletId: null,
          description: null,
          createdAt: new Date(),
        } as Transaction,
        {
          id: 'tx-2',
          walletId: 'test-id',
          type: TransactionType.TRANSFER_OUT,
          amount: 30,
          relatedWalletId: null,
          description: null,
          createdAt: new Date(),
        } as Transaction,
        {
          id: 'tx-3',
          walletId: 'test-id',
          type: TransactionType.TRANSFER_IN,
          amount: 20,
          relatedWalletId: null,
          description: null,
          createdAt: new Date(),
        } as Transaction,
      ];

      const wallet = { ...mockWallet, balance: 90 };
      const result = verifyBalanceIntegrity(wallet, transactions);

      expect(result.isValid).toBe(true);
      expect(result.calculatedBalance).toBe(90);
    });
  });
});

