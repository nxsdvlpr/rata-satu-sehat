import {
  RabbitHeader,
  RabbitPayload,
  RabbitRequest,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SubscribeService } from 'src/app/subscribe/subscribe.service';
import { RMQBasePayload } from 'src/common/interfaces/rmq.interface';

@Injectable()
export class InteractionSubscriberSatuSehat {
  private enabledClinicIdSatuSehat: string[];
  constructor(
    private subscribeService: SubscribeService,
    private configService: ConfigService,
  ) {
    const enabledClinicIdSatuSehatString = this.configService.get<string>(
      'ENABLED_CLINIC_ID_SATU_SEHAT',
    );
    this.enabledClinicIdSatuSehat = enabledClinicIdSatuSehatString
      ? enabledClinicIdSatuSehatString.split(',')
      : [];
  }

  // @RabbitSubscribe({
  //   exchange: 'rata.medical',
  //   routingKey: 'medical.schedule.updated',
  // })
  // async onUpdatedEmr(
  //   @RabbitPayload() payload: RMQBasePayload,
  //   @RabbitRequest() request: any,
  //   @RabbitHeader() header: any,
  // ) {
  //   try {
  //     this.subscribeService.syncConditionSatuSehatApi(payload, request, header);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  @RabbitSubscribe({
    exchange: 'rata.medical',
    routingKey: 'medical.schedule.updated',
  })
  async onCheckinInteraction(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    if (await this.checkClinicIdSatuSehat(payload.newData.clinicId)) {
      console.log('sync satu sehat');
      try {
        this.subscribeService.syncSatuSehat(payload, request, header);
      } catch (error) {
        console.log(error);
      }
    }
  }

  async checkClinicIdSatuSehat(clinicId: string): Promise<boolean> {
    return this.enabledClinicIdSatuSehat.includes(clinicId);
  }
}
