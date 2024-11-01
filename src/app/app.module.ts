import { RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq/lib/rabbitmq.module';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { buildRmqConfigUri } from 'src/common/helpers';

import { ExampleModule } from './example/example.module';
import { GqlRequestModule } from './gql-request/gql-request.module';
import { MigrationModule } from './migration/migration.module';
import { SubscribeModule } from './subscribe/subscribe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 1000 * 60,
      max: 1000,
    }),
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): RabbitMQConfig => ({
        uri: buildRmqConfigUri(config),
        connectionInitOptions: { wait: false },
        connectionManagerOptions: {
          reconnectTimeInSeconds: 20,
        },
      }),
    }),
    ScheduleModule.forRoot(), // Initialize ScheduleModule
    GqlRequestModule,
    MigrationModule,
    ExampleModule,
    SubscribeModule,
  ],
})
export class AppModule {}
