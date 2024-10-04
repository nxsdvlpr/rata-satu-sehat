import {
  RabbitHeader,
  RabbitPayload,
  RabbitRequest,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';

import { SubscribeService } from 'src/app/subscribe/subscribe.service';
import { RMQBasePayload } from 'src/common/interfaces/rmq.interface';

@Injectable()
export class CustomerSubscriberSatuSehat {
  constructor(private subscribeService: SubscribeService) {}

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
      console.log('customer.customer.created');
      this.subscribeService.checkPatientApi(payload, request, header);
    } catch (error) {
      console.log(error);
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
      console.log('customer.customer.updated');
      this.subscribeService.checkPatientApi(payload, request, header);
    } catch (error) {
      console.log(error);
    }
  }
}
