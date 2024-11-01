import {
  RabbitHeader,
  RabbitPayload,
  RabbitRequest,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';

import { SubscribeService } from 'src/app/subscribe/subscribe.service';
import { RMQBasePayload } from 'src/common/interfaces/rmq.interface';

import { LoggerService } from '../logger.service';

@Injectable()
export class CustomerSubscriberSatuSehat {
  constructor(
    private subscribeService: SubscribeService,
    private loggerService: LoggerService,
  ) {}

  @RabbitSubscribe({
    exchange: 'rata.customer',
    routingKey: 'customer.customer.created',
  })
  async onCustomerCreated(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    try {
      this.subscribeService.checkPatientApi(payload, request, header);
    } catch (error) {
      this.loggerService.logError(error);
    }
  }

  @RabbitSubscribe({
    exchange: 'rata.customer',
    routingKey: 'customer.customer.updated',
  })
  async onCustomerUpdated(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    try {
      this.subscribeService.checkPatientApi(payload, request, header);
    } catch (error) {
      this.loggerService.logError(error);
    }
  }
}
