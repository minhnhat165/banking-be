import { config } from 'dotenv';

config();

export const DB = {
  HOST: process.env.DB_HOST,
  PORT: process.env.DB_PORT,
  USERNAME: process.env.DB_USERNAME,
  PASSWORD: process.env.DB_PASSWORD,
  DATABASE: process.env.DB_DATABASE,
  DIALECT: process.env.DB_DIALECT,
};

export const JWT = {
  SECRET: process.env.JWT_SECRET,
  EXPIRES_IN: process.env.JWT_EXPIRES_IN,
};

export default () => ({
  DB,
  JWT,
});
