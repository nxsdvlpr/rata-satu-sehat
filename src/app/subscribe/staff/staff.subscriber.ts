import {
  RabbitHeader,
  RabbitPayload,
  RabbitRequest,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';

import { SubscribeService } from 'src/app/subscribe/subscribe.service';
import { RMQBasePayload } from 'src/common/interfaces/rmq.interface';

import { LoggerService } from '../logger.service';

@Injectable()
export class StaffSubscriberSatuSehat {
  constructor(
    private subscribeService: SubscribeService,
    private loggerService: LoggerService,
  ) {}

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
      this.subscribeService.checkPractitionerApi(payload, request, header);
    } catch (error) {
      this.loggerService.logError(error);
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
      this.subscribeService.checkPractitionerApi(payload, request, header);
    } catch (error) {
      this.loggerService.logError(error);
    }
  }

  @RabbitSubscribe({
    exchange: 'rata.medical',
    routingKey: 'medical.clinicStaff.created',
  })
  async createClinicStaff(
    @RabbitPayload() payload: RMQBasePayload,
    @RabbitRequest() request: any,
    @RabbitHeader() header: any,
  ) {
    try {
      this.subscribeService.getPractitionerApi(payload, request, header);
    } catch (error) {
      this.loggerService.logError(error);
    }
  }
}
