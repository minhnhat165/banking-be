import { Column, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'Interest_Payment_Method',
})
export class InterestPayment extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;
  @Column
  name: string;
  @Column
  description: string;
}
