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
export class RoomSubscriberSatuSehat {
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

  @RabbitSubscribe({
    exchange: 'rata.medical',
    routingKey: 'medical.room.created',
  })
  async onRoomCreated(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    if (await this.checkClinicIdSatuSehat(payload.newData.clinicId)) {
      try {
        this.subscribeService.createLocation(payload, request, header);
      } catch (error) {
        console.log(error);
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
      console.log(error);
    }
  }

  async checkClinicIdSatuSehat(clinicId: string): Promise<boolean> {
    return this.enabledClinicIdSatuSehat.includes(clinicId);
  }
}
