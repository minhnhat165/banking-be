import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

import { Transform } from 'class-transformer';

export class ActivateAccountDto {
  @IsNotEmpty()
  readonly number: string;
  @IsNotEmpty()
  @Length(6, 6)
  @Transform(({ value }) => value.toString())
  readonly newPin: string;

  @IsNumberString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toString())
  @Length(6, 6)
  readonly pin: string;
}
