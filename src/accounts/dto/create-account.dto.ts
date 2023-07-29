import { CreateCustomerDto } from 'src/customers/dto/create-customer.dto';

export class CreateAccountDto {
  readonly balance: number;
  readonly interestRateId: number;
  readonly paymentMethodId: number;
  readonly rolloverId: number;
  readonly type: number;
  readonly customerId?: number;
  readonly customer?: CreateCustomerDto;
}
