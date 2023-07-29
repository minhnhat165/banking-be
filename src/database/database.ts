import { DB } from 'src/common/constant/env';
import { Product } from 'src/products/products.model';
import { Role } from 'src/roles/role.model';
import { Sequelize } from 'sequelize-typescript';
import { User } from 'src/users/user.model';

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
      sequelize.addModels([User, Role, Product]);

      // await sequelize.sync();
      return sequelize;
    },
  },
];
