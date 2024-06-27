import {
  RabbitHeader,
  RabbitPayload,
  RabbitRequest,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';

import { RMQBasePayload } from 'src/common/interfaces/rmq.interface';

import { ExampleService } from '../example.service';

@Injectable()
export class BankSubscriber {
  constructor(private exampleService: ExampleService) {}

  @RabbitSubscribe({
    exchange: 'rata.base',
    routingKey: 'base.bank.created',
  })
  async onBankCreated(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    console.log('Bank Created', payload, request, header);
  }

  @RabbitSubscribe({
    exchange: 'rata.base',
    routingKey: 'base.bank.updated',
  })
  async onBankUpdated(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    console.log('Bank Updated', payload, request, header);

    const banks = await this.exampleService.banks();
    console.log('Banks', banks);
  }

  @RabbitSubscribe({
    exchange: 'rata.base',
    routingKey: 'base.bank.deleted',
  })
  async onBankDeleted(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    console.log('Bank Deleted', payload, request, header);
  }
}
