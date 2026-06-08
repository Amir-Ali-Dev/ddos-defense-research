import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Only enable this when the app is actually behind a trusted proxy/CDN.
  app.getHttpAdapter().getInstance().set('trust proxy', 'loopback, linklocal, uniquelocal');

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();

