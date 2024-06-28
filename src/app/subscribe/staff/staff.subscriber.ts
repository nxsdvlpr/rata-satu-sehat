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
export class StaffSubscriberSatuSehat {
  constructor(private subscribeService: SubscribeService) {}

  @RabbitSubscribe({
    exchange: 'rata.medical',
    routingKey: 'medical.staff.created',
  })
  async onStaffCreated(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    try {
      console.log('aaa');
      this.subscribeService.checkPractitionerApi(payload, request, header);
    } catch (error) {
      console.log(error);
    }
  }

  @RabbitSubscribe({
    exchange: 'rata.medical',
    routingKey: 'medical.staff.updated',
  })
  async onStaffUpdated(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    try {
      console.log('bbb');
      this.subscribeService.checkPractitionerApi(payload, request, header);
    } catch (error) {
      console.log(error);
    }
  }
}
