import { Transform } from 'class-transformer';

export class CreateUserPermissionDto {
  @Transform(({ value }) => parseInt(value))
  readonly userId: number;
  @Transform(({ value }) => parseInt(value))
  readonly permissionId: number;
  @Transform(({ value }) => parseInt(value))
  readonly screenId: number;
}
