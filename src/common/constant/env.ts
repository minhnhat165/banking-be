import { config } from 'dotenv';

config();

export const CLIENT = {
  URL: process.env.CLIENT_URL,
};

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
  EMAIL_SECRET: process.env.VERIFY_EMAIL_TOKEN_SECRET,
  EMAIL_EXPIRES_IN: process.env.VERIFY_EMAIL_TOKEN_EXPIRES_IN,
  RESET_PASSWORD_SECRET: process.env.RESET_PASSWORD_TOKEN_SECRET,
  RESET_PASSWORD_EXPIRES_IN: process.env.RESET_PASSWORD_TOKEN_EXPIRES_IN,
};

export const MAILER = {
  HOST: process.env.EMAIL_HOST,
  PORT: process.env.EMAIL_PORT,
  SECURE: process.env.EMAIL_SECURE === 'true',
  USER: process.env.EMAIL_USERNAME,
  PASSWORD: process.env.EMAIL_PASSWORD,
  FROM: process.env.EMAIL_FROM,
};

export default () => ({
  DB,
  JWT,
});
