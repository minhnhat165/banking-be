import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class CreateCustomerDto {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly dob: Date;
  readonly phone: string;
  readonly address: string;
  @IsNotEmpty()
  @Length(12, 12)
  @IsNumberString()
  readonly pin: string;
  readonly gender: number;
}
