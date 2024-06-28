import { Command, CommandRunner } from 'nest-commander';

import { GqlRequestService } from 'src/app/gql-request/gql-request.service';

import { PushDataRoomSatuSehatService } from './push-data-room-satu-sehat.service';

@Command({
  name: 'push:data-room-satu-sehat',
})
export class PushDataRoomSatuSehatCommand extends CommandRunner {
  private service = new PushDataRoomSatuSehatService();
  constructor(private readonly gqlRequestService: GqlRequestService) {
    super();
  }

  async run(): Promise<void> {
    console.log('Running SatuSehat room sync');
    await this.service.runSatuSehatRoomSync(this.gqlRequestService);
  }
}
