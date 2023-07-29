import { IsNumberString, IsOptional, Length } from 'class-validator';

export class UpdateCustomerDto {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly dob: Date;
  readonly phone: string;
  readonly address: string;
  @IsOptional()
  @Length(12, 12)
  @IsNumberString()
  readonly pin: string;
  readonly gender: number;
}
