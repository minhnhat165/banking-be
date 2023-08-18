import { Column, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'Customer_Info',
})
export class Customer extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ field: 'first_name' })
  firstName: string;

  @Column({ field: 'last_name' })
  lastName: string;

  @Column
  dob: Date;

  @Column
  phone: string;

  @Column
  email: string;

  @Column
  address: string;

  @Column
  pin: string;
  @Column
  gender: number;
  @Column
  mPass: string;

  @Column({ field: 'created_date' })
  createdDate: Date;
}
