export class CreateTransactionDto {
  readonly accountId: number;
  readonly amount: number;
  readonly type: number;
  readonly description: string;
  readonly balance: number;
  readonly bnfAccountId?: number;
  readonly drcrInd?: number;
}
