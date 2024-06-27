import {
  GraphQLClientInject,
  GraphQLRequestModule,
  GraphQLRequestModuleConfig,
} from '@golevelup/nestjs-graphql-request';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLClient } from 'graphql-request';

import { getSdk } from 'generated/gql/gql';

import { GqlRequestService } from './gql-request.service';

@Global()
@Module({
  imports: [
    GraphQLRequestModule.forRootAsync(GraphQLRequestModule, {
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): GraphQLRequestModuleConfig => ({
        endpoint: config.get<string>('GATEWAY_SERVICE_ENPOINT'),
        options: {
          headers: {
            'content-type': 'application/json',
            ISC: config.get<string>('ISC_SECRET'),
          },
        },
      }),
    }),
  ],
  providers: [
    GqlRequestService,
    {
      provide: 'GQL_REQUEST',
      inject: [GraphQLClientInject],
      useFactory: async (client: GraphQLClient) => getSdk(client),
    },
  ],
  exports: [GraphQLRequestModule, 'GQL_REQUEST', GqlRequestService],
})
export class GqlRequestModule {}
