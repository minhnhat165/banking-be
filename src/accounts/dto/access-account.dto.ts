import { IsNotEmpty } from 'class-validator';

export class AccessAccountDto {
  @IsNotEmpty()
  readonly number: string;
  @IsNotEmpty()
  readonly pin: string;
}
