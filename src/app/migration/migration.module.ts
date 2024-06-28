import { Module } from '@nestjs/common';

import { PushDataClinicSatuSehatCommand } from './command/push-data-clinic-satu-sehat.command';
import { PushDataRoomSatuSehatCommand } from './command/push-data-room-satu-sehat.command';
import { MigrationResolver } from './migration.resolver';

@Module({
  providers: [
    MigrationResolver,
    PushDataClinicSatuSehatCommand,
    PushDataRoomSatuSehatCommand,
  ],
})
export class MigrationModule {}
