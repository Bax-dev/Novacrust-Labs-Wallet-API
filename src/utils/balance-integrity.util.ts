import { Wallet } from '../models/entity/wallet.entity';
import { Transaction } from '../models/entity/transaction.entity';
import { TransactionType } from '../types/transaction.types';

export function verifyBalanceIntegrity(
  wallet: Wallet,
  transactions: Transaction[],
): { isValid: boolean; calculatedBalance: number; currentBalance: number; discrepancy: number } {
  const currentBalance = Number(wallet.balance);
  
  let calculatedBalance = 0;
  
  for (const transaction of transactions) {
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
  
  const discrepancy = Math.abs(currentBalance - calculatedBalance);
  const isValid = discrepancy < 0.01;
  return {
    isValid,
    calculatedBalance,
    currentBalance,
    discrepancy,
  };
}


export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}


export function validateBalanceRange(balance: number): boolean {
  const minBalance = 0;
  const maxBalance = 999999999.99;
  return balance >= minBalance && balance <= maxBalance;
}

