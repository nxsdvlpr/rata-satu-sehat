import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const configService = app.get(ConfigService);

  await app.listen(configService.get('APP_PORT'));

  console.log(
    `----------\nStart ${configService.get(
      'APP_NAME',
    )} service at http://${configService.get('APP_HOST')}:${configService.get(
      'APP_PORT',
    )}/ ...\n----------\n`,
  );
}
bootstrap();
