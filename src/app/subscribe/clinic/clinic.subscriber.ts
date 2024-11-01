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

import { LoggerService } from '../logger.service';

@Injectable()
export class ClinicSubscriberSatuSehat {
  private enabledClinicIdSatuSehat: string[];
  private enabledUnitIdSatuSehat: string[];
  constructor(
    private subscribeService: SubscribeService,
    private configService: ConfigService,
    private gqlRequestService: GqlRequestService,
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
    routingKey: 'medical.clinic.created',
  })
  async onClinicCreated(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    const unit = await this.subscribeService.unit(payload.newData.unitId);

    if (await this.checkUnitIdSatuSehat(unit.id)) {
      try {
        await this.subscribeService.createClinicBuilding(
          payload,
          request,
          header,
        );
      } catch (error) {
        this.loggerService.logError(error);
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
