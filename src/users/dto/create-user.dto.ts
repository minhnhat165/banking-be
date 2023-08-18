export class CreateUserDto {
  readonly email: string;
  readonly avatar: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly dob: Date;
  readonly phone: string;
  readonly address: string;
  readonly gender: number;
  readonly status?: number;
}
