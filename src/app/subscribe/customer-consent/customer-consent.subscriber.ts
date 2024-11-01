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
export class CustomerConsentSubscriberSatuSehat {
  constructor(
    private subscribeService: SubscribeService,
    private loggerService: LoggerService,
  ) {}

  @RabbitSubscribe({
    exchange: 'rata.customer',
    routingKey: 'customer.customer.satusehatSettled',
  })
  async onCustomerConsentCreated(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    try {
      await this.subscribeService.customerConsentPost(payload?.data);
    } catch (error) {
      this.loggerService.logError(error);
    }
  }
}
