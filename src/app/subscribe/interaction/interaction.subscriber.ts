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
export class InteractionSubscriberSatuSehat {
  constructor(private subscribeService: SubscribeService) {}

  @RabbitSubscribe({
    exchange: 'rata.medical',
    routingKey: 'medical.schedule.updated',
  })
  async onUpdatedEmr(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    try {
      console.log('');
      this.subscribeService.syncConditionSatuSehatApi(payload, request, header);
    } catch (error) {
      console.log(error);
    }
  }

  @RabbitSubscribe({
    exchange: 'rata.medical',
    routingKey: 'medical.interaction.updated',
  })
  async onCheckinInteraction(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    try {
      this.subscribeService.syncEncounterSatuSehatApi(payload, request, header);
    } catch (error) {
      console.log(error);
    }
  }
}
