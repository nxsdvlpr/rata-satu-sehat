import { Inject, Injectable } from '@nestjs/common';

import {
  BanksQuery,
  BanksQueryVariables,
  ClinicQuery,
  ClinicQueryVariables,
  ClinicsQuery,
  ClinicsQueryVariables,
  CreateBankMutation,
  CreateBankMutationVariables,
  CustomerQuery,
  CustomerQueryVariables,
  EmrByInteractionIdQuery,
  EmrByInteractionIdQueryVariables,
  Icd10Query,
  Icd10QueryVariables,
  RegionQuery,
  RegionQueryVariables,
  RegionsQuery,
  RegionsQueryVariables,
  RoomQuery,
  RoomQueryVariables,
  RoomsQuery,
  RoomsQueryVariables,
  Sdk,
  StaffQuery,
  StaffQueryVariables,
  UnitQuery,
  UnitQueryVariables,
  UpdateClinicWithoutRmqMutation,
  UpdateClinicWithoutRmqMutationVariables,
  UpdateCustomerWithoutRmqMutation,
  UpdateCustomerWithoutRmqMutationVariables,
  UpdateRoomWithoutRmqMutation,
  UpdateRoomWithoutRmqMutationVariables,
  UpdateStaffWithoutRmqMutation,
  UpdateStaffWithoutRmqMutationVariables,
  UpsertEmrByInteractionIdMutation,
  UpsertEmrByInteractionIdMutationVariables,
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

  async regions(
    args: RegionsQueryVariables,
  ): Promise<RegionsQuery['regions']['nodes'] | []> {
    try {
      const res = await this.gql.regions(args);
      return res?.regions?.nodes;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }
    return [];
  }

  async region(
    args: RegionQueryVariables,
  ): Promise<RegionQuery['region'] | null> {
    try {
      const res = await this.gql.region(args);
      return res?.region;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }
    return null;
  }

  async clinics(
    args: ClinicsQueryVariables,
  ): Promise<ClinicsQuery['clinics']['nodes'] | []> {
    try {
      const res = await this.gql.clinics(args);
      return res?.clinics?.nodes;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }
    return [];
  }

  async clinic(
    args: ClinicQueryVariables,
  ): Promise<ClinicQuery['clinic'] | null> {
    try {
      const res = await this.gql.clinic(args);
      return res?.clinic;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }
    return null;
  }

  async rooms(
    args: RoomsQueryVariables,
  ): Promise<RoomsQuery['rooms']['nodes'] | []> {
    try {
      const res = await this.gql.rooms(args);
      return res?.rooms.nodes;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }
    return [];
  }

  async room(args: RoomQueryVariables): Promise<RoomQuery['room'] | null> {
    try {
      const res = await this.gql.room(args);
      return res?.room;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }
    return null;
  }

  async customer(
    args: CustomerQueryVariables,
  ): Promise<CustomerQuery['customer'] | null> {
    try {
      const res = await this.gql.customer(args);
      return res?.customer;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }
    return null;
  }

  async staff(args: StaffQueryVariables): Promise<StaffQuery['staff'] | null> {
    try {
      const res = await this.gql.staff(args);
      return res?.staff;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }
    return null;
  }

  async updateClinicWithoutRmq(
    args: UpdateClinicWithoutRmqMutationVariables,
  ): Promise<UpdateClinicWithoutRmqMutation['updateClinicWithoutRmq'] | null> {
    try {
      const res = await this.gql.updateClinicWithoutRmq(args);
      return res?.updateClinicWithoutRmq || null;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }

    return null;
  }

  async updateRoomWithoutRmq(
    args: UpdateRoomWithoutRmqMutationVariables,
  ): Promise<UpdateRoomWithoutRmqMutation['updateRoomWithoutRmq'] | null> {
    try {
      const res = await this.gql.updateRoomWithoutRmq(args);
      return res?.updateRoomWithoutRmq || null;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }

    return null;
  }

  async unit(args: UnitQueryVariables): Promise<UnitQuery['unit'] | null> {
    try {
      const res = await this.gql.unit(args);
      return res?.unit;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }
    return null;
  }

  async icd10(args: Icd10QueryVariables): Promise<Icd10Query['icd10'] | null> {
    try {
      const res = await this.gql.icd10(args);
      return res?.icd10;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }
    return null;
  }

  async updateStaffWithoutRmq(
    args: UpdateStaffWithoutRmqMutationVariables,
  ): Promise<UpdateStaffWithoutRmqMutation['updateStaffWithoutRmq'] | null> {
    try {
      const res = await this.gql.updateStaffWithoutRmq(args);
      return res?.updateStaffWithoutRmq || null;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }

    return null;
  }

  async updateCustomerWithoutRmq(
    args: UpdateCustomerWithoutRmqMutationVariables,
  ): Promise<
    UpdateCustomerWithoutRmqMutation['updateCustomerWithoutRmq'] | null
  > {
    try {
      const res = await this.gql.updateCustomerWithoutRmq(args);
      return res?.updateCustomerWithoutRmq || null;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }

    return null;
  }

  async emrByInteractionId(
    args: EmrByInteractionIdQueryVariables,
  ): Promise<EmrByInteractionIdQuery['emrByInteractionId'] | null> {
    try {
      const res = await this.gql.emrByInteractionId(args);
      return res?.emrByInteractionId;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }
    return null;
  }

  async UpsertEmrByInteractionId(
    args: UpsertEmrByInteractionIdMutationVariables,
  ): Promise<
    UpsertEmrByInteractionIdMutation['upsertEmrByInteractionId'] | null
  > {
    try {
      const res = await this.gql.upsertEmrByInteractionId(args);
      return res?.upsertEmrByInteractionId || null;
    } catch (error) {
      console.log('Error [GqlRequest]', error);
    }

    return null;
  }
}
