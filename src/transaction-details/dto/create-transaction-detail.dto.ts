export class CreateTransactionDetailDto {
  transactionId: number;
  accountId: number;
  balance: number;
  isIncrease: boolean;
  fee?: number;
  description: string;
  accountNumber: string;
  email: string;
  amount: number;
}
