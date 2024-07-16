import {
  RabbitHeader,
  RabbitPayload,
  RabbitRequest,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { GqlRequestService } from 'src/app/gql-request/gql-request.service';
import { SubscribeService } from 'src/app/subscribe/subscribe.service';
import { RMQBasePayload } from 'src/common/interfaces/rmq.interface';

@Injectable()
export class ClinicSubscriberSatuSehat {
  private enabledClinicIdSatuSehat: string[];
  constructor(
    private subscribeService: SubscribeService,
    private configService: ConfigService,
    private gqlRequestService: GqlRequestService,
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
    routingKey: 'medical.clinic.created',
  })
  async onClinicCreated(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    if (await this.checkClinicIdSatuSehat(payload.newData.clinicId)) {
      try {
        console.log('medical.clinic.created');
        this.subscribeService.createOrganization(payload, request, header);
      } catch (error) {
        console.log(error);
      }
    }
  }

  @RabbitSubscribe({
    exchange: 'rata.medical',
    routingKey: 'medical.unit.updated',
  })
  async onUnitUpdated(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    try {
      console.log('medical.unit.updated');

      const unit = await this.gqlRequestService.unit({
        id: payload.newData?.id,
      });

      if (
        unit.clinic.id &&
        (await this.checkClinicIdSatuSehat(unit.clinic.id))
      ) {
        if (
          unit.clinic.ssOrganizationId === null &&
          unit.clinic.ssLocationId === null
        ) {
          this.subscribeService.createOrganizationWithDataClinic(
            payload,
            request,
            header,
          );
        } else {
          this.subscribeService.updateOrganization(payload, request, header);
        }
      }

      console.log('zzz');
    } catch (error) {
      console.log(error);
    }
  }

  async checkClinicIdSatuSehat(clinicId: string): Promise<boolean> {
    return this.enabledClinicIdSatuSehat.includes(clinicId);
  }
}
