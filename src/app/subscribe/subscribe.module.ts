import { Module } from '@nestjs/common';

import { ClinicSubscriberSatuSehat } from './clinic/clinic.subscriber';
import { InteractionSubscriberSatuSehat } from './interaction/interaction.subscriber';
import { RoomSubscriberSatuSehat } from './room/room.subscriber';
import { SubscribeService } from './subscribe.service';

@Module({
  providers: [
    ClinicSubscriberSatuSehat,
    RoomSubscriberSatuSehat,
    SubscribeService,
    InteractionSubscriberSatuSehat,
  ],
  exports: [SubscribeService],
})
export class SubscribeModule {}
