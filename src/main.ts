import * as passport from 'passport';

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api', { exclude: ['/'] });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.use(passport.initialize());
  await app.listen(8080);
}
bootstrap();
