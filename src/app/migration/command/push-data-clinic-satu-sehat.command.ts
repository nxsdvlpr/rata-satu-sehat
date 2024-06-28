import { Command, CommandRunner } from 'nest-commander';

import { GqlRequestService } from 'src/app/gql-request/gql-request.service';

import { PushDataClinicSatuSehatService } from './push-data-clinic-satu-sehat.service';

@Command({
  name: 'push:data-clinic-satu-sehat',
})
export class PushDataClinicSatuSehatCommand extends CommandRunner {
  private service = new PushDataClinicSatuSehatService();
  constructor(private readonly gqlRequestService: GqlRequestService) {
    super();
  }

  async run(): Promise<void> {
    console.log('Running SatuSehat organization sync');
    await this.service.runSatuSehatOrganizationSync(this.gqlRequestService);
  }
}
