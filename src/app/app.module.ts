import { RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq/lib/rabbitmq.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { buildRmqConfigUri } from 'src/common/helpers';

import { ExampleModule } from './example/example.module';
import { GqlRequestModule } from './gql-request/gql-request.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
    GqlRequestModule,
    ExampleModule,
  ],
})
export class AppModule {}
