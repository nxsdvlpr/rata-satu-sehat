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
export class RoomSubscriberSatuSehat {
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
    routingKey: 'medical.room.created',
  })
  async onRoomCreated(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    const clinic = await this.subscribeService.clinic(payload.newData.clinicId);
    if (await this.checkUnitIdSatuSehat(clinic.unit?.id)) {
      try {
        this.subscribeService.createLocation(payload, request, header);
      } catch (error) {
        this.loggerService.logError(error);
      }
    }
  }

  @RabbitSubscribe({
    exchange: 'rata.medical',
    routingKey: 'medical.room.updated',
  })
  async onRoomUpdated(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    try {
      if (await this.checkClinicIdSatuSehat(payload.newData.clinicId)) {
        if (payload.newData.ssLocationId === null) {
          this.subscribeService.createLocation(payload, request, header);
        } else {
          this.subscribeService.updateLocation(payload, request, header);
        }
      }
    } catch (error) {
      this.loggerService.logError(error);
    }
  }

  async checkClinicIdSatuSehat(clinicId: string): Promise<boolean> {
    return this.enabledClinicIdSatuSehat.includes(clinicId);
  }

  async checkUnitIdSatuSehat(unitId: string): Promise<boolean> {
    return this.enabledUnitIdSatuSehat.includes(unitId);
  }
}
