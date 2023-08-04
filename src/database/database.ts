import { Account } from 'src/accounts/account.model';
import { Customer } from 'src/customers/customer.model';
import { DB } from 'src/common/constant/env';
import { InterestPayment } from 'src/interest-payments/interest-payment.model';
import { InterestRate } from 'src/interest-rates/interest-rate.model';
import { Permission } from 'src/permission/permission.model';
import { Product } from 'src/products/product.model';
import { Role } from 'src/roles/role.model';
import { Rollover } from 'src/rollovers/rollover.model';
import { Sequelize } from 'sequelize-typescript';
import { Term } from 'src/terms/terms.model';
import { Transaction } from 'src/transactions/transaction.model';
import { User } from 'src/users/user.model';
import { UserPermission } from 'src/user-permissions/user-permission.model';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      const sequelize = new Sequelize({
        dialect: 'mssql',
        host: DB.HOST,
        port: +DB.PORT,
        username: DB.USERNAME,
        password: DB.PASSWORD,
        database: DB.DATABASE,
        define: {
          freezeTableName: true,
          createdAt: false,
          updatedAt: false,
        },
      });

      /**
       * Add Models Here
       * ===============
       * You can add the models to
       * Sequelize later on.
       */
      sequelize.addModels([
        User,
        Role,
        Product,
        Term,
        Rollover,
        InterestPayment,
        Customer,
        InterestRate,
        Account,
        Transaction,
        Permission,
        UserPermission,
      ]);

      // await sequelize.sync();
      return sequelize;
    },
  },
];
