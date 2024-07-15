import { Module } from '@nestjs/common';

import { ClinicSubscriberSatuSehat } from './clinic/clinic.subscriber';
import { CustomerSubscriberSatuSehat } from './customer/customer.subscriber';
import { InteractionSubscriberSatuSehat } from './interaction/interaction.subscriber';
import { RoomSubscriberSatuSehat } from './room/room.subscriber';
import { StaffSubscriberSatuSehat } from './staff/staff.subscriber';
import { SubscribeService } from './subscribe.service';

@Module({
  providers: [
    StaffSubscriberSatuSehat,
    CustomerSubscriberSatuSehat,
    ClinicSubscriberSatuSehat,
    RoomSubscriberSatuSehat,
    SubscribeService,
    InteractionSubscriberSatuSehat,
  ],
  exports: [SubscribeService],
})
export class SubscribeModule {}
