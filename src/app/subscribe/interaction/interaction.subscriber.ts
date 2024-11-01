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

import { LoggerService } from '../logger.service';

@Injectable()
export class InteractionSubscriberSatuSehat {
  private enabledClinicIdSatuSehat: string[];
  private enabledUnitIdSatuSehat: string[];

  constructor(
    private subscribeService: SubscribeService,
    private configService: ConfigService,
    private loggerService: LoggerService,
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

  @RabbitSubscribe({
    exchange: 'rata.medical',
    routingKey: 'medical.interaction.setStatus',
  })
  async onCheckinInteraction(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    const clinic = await this.subscribeService.clinic(payload.newData.clinicId);
    if (await this.checkUnitIdSatuSehat(clinic.unitId)) {
      try {
        await this.subscribeService.syncSatuSehat(payload, request, header);
      } catch (error) {
        this.loggerService.logError(error);
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
