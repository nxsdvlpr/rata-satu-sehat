import { Inject, Injectable } from '@nestjs/common';

import {
  BanksQuery,
  BanksQueryVariables,
  CreateBankMutation,
  CreateBankMutationVariables,
  Sdk,
} from 'generated/gql/gql';

@Injectable()
export class GqlRequestService {
  constructor(@Inject('GQL_REQUEST') private gql: Sdk) {}

  async banks(args: BanksQueryVariables): Promise<BanksQuery['banks'] | []> {
    try {
      const res = await this.gql.banks(args);
      return res?.banks || [];
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }

    return null;
  }

  async createBank(
    args: CreateBankMutationVariables,
  ): Promise<CreateBankMutation['createBank'] | null> {
    try {
      const res = await this.gql.createBank(args);
      return res?.createBank || null;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }

    return null;
  }
}
