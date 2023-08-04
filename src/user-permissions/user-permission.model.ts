import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import { Permission } from 'src/permission/permission.model';
import { User } from 'src/users/user.model';

@Table({
  tableName: 'User_Permission',
})
export class UserPermission extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => User)
  @Column({
    field: 'user_id',
  })
  userId: number;
  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Permission)
  @Column({
    field: 'permission_id',
  })
  permissionId: number;
  @BelongsTo(() => Permission)
  permission: Permission;

  @Column({
    field: 'screen_id',
  })
  screenId: number;
}
