import { CreateCustomerDto } from 'src/customers/dto/create-customer.dto';
import { Transform } from 'class-transformer';

export class CreateAccountDto {
  @Transform(({ value }) => parseInt(value))
  principal: number;
  @Transform(({ value }) => parseInt(value))
  productId: number;
  @Transform(({ value }) => parseInt(value))
  termId: number;
  @Transform(({ value }) => parseInt(value))
  interestRate: number;
  @Transform(({ value }) => parseInt(value))
  paymentMethodId: number;
  @Transform(({ value }) => parseInt(value))
  rolloverId: number;
  @Transform(({ value }) => parseInt(value))
  type: number;
  @Transform(({ value }) => parseInt(value))
  customerId?: number;
  customer?: CreateCustomerDto;
  sourceAccountEmail?: string;
  @Transform(({ value }) => parseInt(value))
  sourceAccountId?: number;
  @Transform(({ value }) => parseInt(value))
  sourceAccountNumber?: number;
  @Transform(({ value }) => parseInt(value))
  transferAccountId?: number;
}
