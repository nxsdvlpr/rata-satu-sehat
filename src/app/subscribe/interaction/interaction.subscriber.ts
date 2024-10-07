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
  private enabledUnitIdSatuSehat: string[];

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

    const enabledUnitIdSatuSehatString = this.configService.get<string>(
      'ENABLED_UNIT_ID_SATU_SEHAT',
    );
    this.enabledUnitIdSatuSehat = enabledUnitIdSatuSehatString
      ? enabledUnitIdSatuSehatString.split(',')
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
    routingKey: 'medical.interaction.setStatus',
  })
  async onCheckinInteraction(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    console.log('medical.interaction.setStatus');
    // console.log(payload.newData.clinicId);
    // const check = await this.checkClinicIdSatuSehat(payload.newData.clinicId);
    // console.log(check);
    const clinic = await this.subscribeService.clinic(payload.newData.clinicId);
    if (await this.checkUnitIdSatuSehat(clinic.unitId)) {
      console.log('sync satu sehat');
      try {
        await this.subscribeService.syncSatuSehat(payload, request, header);
      } catch (error) {
        console.log(error);
      }
    }
  }

  async checkClinicIdSatuSehat(clinicId: string): Promise<boolean> {
    return this.enabledClinicIdSatuSehat.includes(clinicId);
  }

  async checkUnitIdSatuSehat(unitId: string): Promise<boolean> {
    return this.enabledUnitIdSatuSehat.includes(unitId);
  }
}
