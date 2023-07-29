export class CreateInterestRateDto {
  readonly productId: number;
  readonly termId: number;
  readonly status: number;
  readonly value: number;
  readonly effectiveDate: Date;
  readonly expiredDate: Date;
}
