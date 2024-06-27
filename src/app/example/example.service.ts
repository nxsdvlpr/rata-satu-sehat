import { Injectable } from '@nestjs/common';

import { GqlRequestService } from '../gql-request/gql-request.service';

@Injectable()
export class ExampleService {
  constructor(private gqlRequestService: GqlRequestService) {}

  async hello() {
    return 'Hello World';
  }

  async banks() {
    return this.gqlRequestService.banks({});
  }
}
