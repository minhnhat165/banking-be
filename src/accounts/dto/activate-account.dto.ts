import { IsNotEmpty, Length } from 'class-validator';

export class ActivateAccountDto {
  readonly number: string;
  @IsNotEmpty()
  @Length(6, 6)
  readonly newPin: string;
  @IsNotEmpty()
  @Length(6, 6)
  readonly pin: string;
}
