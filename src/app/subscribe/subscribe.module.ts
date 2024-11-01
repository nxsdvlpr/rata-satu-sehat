import { Module } from '@nestjs/common';

import { ClinicSubscriberSatuSehat } from './clinic/clinic.subscriber';
import { CustomerConsentSubscriberSatuSehat } from './customer-consent/customer-consent.subscriber';
import { CustomerSubscriberSatuSehat } from './customer/customer.subscriber';
import { InteractionSubscriberSatuSehat } from './interaction/interaction.subscriber';
import { LoggerService } from './logger.service';
import { RoomSubscriberSatuSehat } from './room/room.subscriber';
import { StaffSubscriberSatuSehat } from './staff/staff.subscriber';
import { SubscribeService } from './subscribe.service';
import { TasksService } from './task.service';

@Module({
  providers: [
    StaffSubscriberSatuSehat,
    CustomerSubscriberSatuSehat,
    ClinicSubscriberSatuSehat,
    RoomSubscriberSatuSehat,
    SubscribeService,
    InteractionSubscriberSatuSehat,
    CustomerConsentSubscriberSatuSehat,
    LoggerService,
    TasksService,
  ],
  exports: [SubscribeService, LoggerService, TasksService],
})
export class SubscribeModule {}
