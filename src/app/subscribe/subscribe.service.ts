/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import e from 'express';
import { url } from 'inspector';

import { GqlRequestService } from 'src/app/gql-request/gql-request.service';
import { RMQBasePayload } from 'src/common/interfaces/rmq.interface';
import { InteractionStatus } from 'src/constants/interaction';

import {
  Customer,
  EmrGeneral,
  Icd10,
  Interaction,
} from '../../../generated/gql/gql';

@Injectable()
export class SubscribeService {
  private config = new ConfigService();
  constructor(private gqlRequestService: GqlRequestService) {}

  async generateToken(): Promise<string> {
    const clientId = this.config.get<string>('SATU_SEHAT_CLIENT_ID');
    const clientSecret = this.config.get<string>('SATU_SEHAT_CLIENT_SECRET');
    const authUrl = this.config.get<string>('SATU_SEHAT_URL_AUTH');

    const response = await axios.post(
      authUrl,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return response.data.access_token;
  }

  async createOrganizationApi(
    token: string,
    clinicId: string,
    organizationData: any,
    locationData: any,
  ): Promise<void> {
    const organizationUrl = this.config.get<string>('SATU_SEHAT_URL_RESOURCE');
    try {
      const response = await axios.post(
        organizationUrl + 'Organization',
        organizationData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await this.gqlRequestService.updateClinicWithoutRmq({
        where: { id: clinicId },
        data: {
          ssOrganizationId: response.data.id,
        },
      });

      locationData.managingOrganization.reference = `Organization/${response.data.id}`;

      try {
        await this.createLocationApi(token, clinicId, locationData);
      } catch (error) {
        console.log('Error creating location for clinic id:', clinicId);
        //console.log(error);
        console.log(error.response.data);
      }
    } catch (error) {
      console.log('Error creating organization for clinic id:', clinicId);
      //console.log(error);
      console.log(error.response.data);
    }
  }

  async createLocationApi(
    token: string,
    entityId: string,
    locationData: any,
  ): Promise<void> {
    const locationUrl = this.config.get<string>('SATU_SEHAT_URL_RESOURCE');
    // console.log("clinic " + clinicId)
    // console.log(locationData)
    try {
      const response = await axios.post(
        locationUrl + 'Location',
        locationData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(locationData.physicalType.coding[0].display);

      if (locationData.physicalType.coding[0].display === 'Room') {
        await this.gqlRequestService.updateRoomWithoutRmq({
          where: { id: entityId },
          data: {
            ssLocationId: response.data.id,
          },
        });
      }

      if (locationData.physicalType.coding[0].display === 'Building') {
        await this.gqlRequestService.updateClinicWithoutRmq({
          where: { id: entityId },
          data: {
            ssLocationId: response.data.id,
          },
        });
      }
    } catch (error) {
      console.log(error);
      console.log(error.response.data);
    }
  }

  async updateOrganizationApi(
    token: string,
    clinicId: string,
    organizationData: any,
    locationData: any,
  ): Promise<void> {
    const organizationUrl = this.config.get<string>('SATU_SEHAT_URL_RESOURCE');
    try {
      const response = await axios.put(
        organizationUrl + 'Organization/' + organizationData.id,
        organizationData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await this.gqlRequestService.updateClinicWithoutRmq({
        where: { id: clinicId },
        data: {
          ssOrganizationId: response.data.id,
        },
      });

      locationData.managingOrganization.reference = `Organization/${response.data.id}`;

      try {
        await this.updateLocationApi(token, clinicId, locationData);
      } catch (error) {
        console.log('Error creating location for clinic id:', clinicId);
        //console.log(error);
        console.log(error.response.data);
      }
    } catch (error) {
      console.log('Error creating organization for clinic id:', clinicId);
      //console.log(error);
      console.log(error.response.data);
    }
  }

  async updateLocationApi(
    token: string,
    entityId: string,
    locationData: any,
  ): Promise<void> {
    const locationUrl = this.config.get<string>('SATU_SEHAT_URL_RESOURCE');
    try {
      const response = await axios.put(
        locationUrl + 'Location/' + locationData.id,
        locationData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(locationData.physicalType.coding[0].display);

      if (locationData.physicalType.coding[0].display === 'Room') {
        await this.gqlRequestService.updateRoomWithoutRmq({
          where: { id: entityId },
          data: {
            ssLocationId: response.data.id,
          },
        });
      }

      if (locationData.physicalType.coding[0].display === 'Building') {
        await this.gqlRequestService.updateClinicWithoutRmq({
          where: { id: entityId },
          data: {
            ssLocationId: response.data.id,
          },
        });
      }
    } catch (error) {
      console.log(error);
      console.log(error.response.data);
    }
  }

  async cleanedString(code: string): Promise<string> {
    return code.replace(/\./g, '');
  }

  async createOrganization(
    payload: RMQBasePayload,
    request: any,
    header?: any,
  ): Promise<any> {
    // console.log("clinic.created")
    // console.log(payload)
    const organizationId = this.config.get<string>(
      'SATU_SEHAT_ORGANIZATION_ID',
    );

    const clinic = await this.gqlRequestService.clinic({
      id: payload.newData?.id,
    });

    const region = await this.gqlRequestService.region({
      id: clinic.unit?.address.regionId,
    });

    const token = await this.generateToken();

    const organizationData = {
      resourceType: 'Organization',
      active: true,
      identifier: [
        {
          use: 'official',
          system: `http://sys-ids.kemkes.go.id/organization/${organizationId}`,
          value: clinic.unit.name,
        },
      ],
      type: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/organization-type',
              code: 'prov',
              display: 'Healthcare Provider',
            },
          ],
        },
      ],
      name: clinic.unit.name,
      telecom: [
        {
          system: 'phone',
          value: clinic.unit.phone,
          use: 'work',
        },
        {
          system: 'email',
          value: clinic.unit.email,
          use: 'work',
        },
        {
          system: 'url',
          value: 'rata.id',
          use: 'work',
        },
      ],
      address: [
        {
          use: 'work',
          type: 'both',
          line: [clinic.unit.address.address],
          city: region.city,
          postalCode: region.postcode,
          country: 'ID',
          extension: [
            {
              url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode',
              extension: [
                {
                  url: 'province',
                  valueCode: await this.cleanedString(region.provinceCode),
                },
                {
                  url: 'city',
                  valueCode: await this.cleanedString(region.cityCode),
                },
                {
                  url: 'district',
                  valueCode: await this.cleanedString(region.subdistrictCode),
                },
              ],
            },
          ],
        },
      ],
      partOf: {
        reference: `Organization/${organizationId}`,
      },
    };

    const locationData = {
      resourceType: 'Location',
      status: 'active',
      name: clinic.unit.name,
      description: clinic.unit.name,
      mode: 'instance',
      telecom: [
        {
          system: 'phone',
          value: clinic.unit.phone,
          use: 'work',
        },
        {
          system: 'email',
          value: clinic.unit.email,
          use: 'work',
        },
        {
          system: 'url',
          value: 'rata.id',
          use: 'work',
        },
      ],
      address: {
        use: 'work',
        line: [clinic.unit.address.address],
        city: region.city,
        postalCode: region.postcode,
        country: 'ID',
        extension: [
          {
            url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode',
            extension: [
              {
                url: 'province',
                valueCode: await this.cleanedString(region.provinceCode),
              },
              {
                url: 'city',
                valueCode: await this.cleanedString(region.cityCode),
              },
              {
                url: 'district',
                valueCode: await this.cleanedString(region.subdistrictCode),
              },
            ],
          },
        ],
      },
      physicalType: {
        coding: [
          {
            system:
              'http://terminology.hl7.org/CodeSystem/location-physical-type',
            code: 'bu',
            display: 'Building',
          },
        ],
      },
      managingOrganization: {
        reference: '',
      },
    };

    await this.createOrganizationApi(
      token,
      clinic.id,
      organizationData,
      locationData,
    );
  }

  async updateOrganization(
    payload: RMQBasePayload,
    request: any,
    header?: any,
  ): Promise<any> {
    //console.log("clinic.updated")

    try {
      //console.log(payload)
      const unit = await this.gqlRequestService.unit({
        id: payload.newData?.id,
      });

      //console.log(unit)

      if (!unit.clinic) {
        throw new Error(
          `Clinic with unit_id ${payload.newData?.id} does not exist`,
        );
      }

      const organizationId = this.config.get<string>(
        'SATU_SEHAT_ORGANIZATION_ID',
      );
      const region = await this.gqlRequestService.region({
        id: unit?.address.regionId,
      });

      const token = await this.generateToken();

      const organizationData = {
        resourceType: 'Organization',
        id: unit.clinic?.ssOrganizationId,
        active: true,
        identifier: [
          {
            use: 'official',
            system: `http://sys-ids.kemkes.go.id/organization/${organizationId}`,
            value: unit.name,
          },
        ],
        type: [
          {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/organization-type',
                code: 'prov',
                display: 'Healthcare Provider',
              },
            ],
          },
        ],
        name: unit.name,
        telecom: [
          {
            system: 'phone',
            value: unit.phone,
            use: 'work',
          },
          {
            system: 'email',
            value: unit.email,
            use: 'work',
          },
          {
            system: 'url',
            value: 'rata.id',
            use: 'work',
          },
        ],
        address: [
          {
            use: 'work',
            type: 'both',
            line: [unit.address.address],
            city: region.city,
            postalCode: region.postcode,
            country: 'ID',
            extension: [
              {
                url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode',
                extension: [
                  {
                    url: 'province',
                    valueCode: await this.cleanedString(region.provinceCode),
                  },
                  {
                    url: 'city',
                    valueCode: await this.cleanedString(region.cityCode),
                  },
                  {
                    url: 'district',
                    valueCode: await this.cleanedString(region.subdistrictCode),
                  },
                ],
              },
            ],
          },
        ],
        partOf: {
          reference: `Organization/${organizationId}`,
        },
      };

      const locationData = {
        resourceType: 'Location',
        status: 'active',
        id: unit.clinic?.ssLocationId,
        name: unit.name,
        description: unit.name,
        mode: 'instance',
        telecom: [
          {
            system: 'phone',
            value: unit.phone,
            use: 'work',
          },
          {
            system: 'email',
            value: unit.email,
            use: 'work',
          },
          {
            system: 'url',
            value: 'rata.id',
            use: 'work',
          },
        ],
        address: {
          use: 'work',
          line: [unit.address.address],
          city: region.city,
          postalCode: region.postcode,
          country: 'ID',
          extension: [
            {
              url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode',
              extension: [
                {
                  url: 'province',
                  valueCode: await this.cleanedString(region.provinceCode),
                },
                {
                  url: 'city',
                  valueCode: await this.cleanedString(region.cityCode),
                },
                {
                  url: 'district',
                  valueCode: await this.cleanedString(region.subdistrictCode),
                },
              ],
            },
          ],
        },
        physicalType: {
          coding: [
            {
              system:
                'http://terminology.hl7.org/CodeSystem/location-physical-type',
              code: 'bu',
              display: 'Building',
            },
          ],
        },
        managingOrganization: {
          reference: '',
        },
      };

      await this.updateOrganizationApi(
        token,
        unit.clinic.id,
        organizationData,
        locationData,
      );
    } catch (error) {
      console.log(error);
    }
  }

  async createLocation(
    payload: RMQBasePayload,
    request: any,
    header?: any,
  ): Promise<any> {
    //console.log("location.created")

    const room = await this.gqlRequestService.room({
      id: payload.newData?.id,
    });

    const region = await this.gqlRequestService.region({
      id: room.clinic?.unit?.address?.regionId,
    });

    const token = await this.generateToken();
    const locationData = {
      resourceType: 'Location',
      status: 'active',
      name: room.name,
      description: room.name,
      mode: 'instance',
      telecom: [
        {
          system: 'phone',
          value: room.clinic?.unit?.phone,
          use: 'work',
        },
        {
          system: 'email',
          value: room.clinic?.unit?.email,
          use: 'work',
        },
        {
          system: 'url',
          value: 'rata.id',
          use: 'work',
        },
      ],
      address: {
        use: 'work',
        line: [room.clinic?.unit?.address.address],
        city: region.city,
        postalCode: region.postcode,
        country: 'ID',
        extension: [
          {
            url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode',
            extension: [
              {
                url: 'province',
                valueCode: await this.cleanedString(region.provinceCode),
              },
              {
                url: 'city',
                valueCode: await this.cleanedString(region.cityCode),
              },
              {
                url: 'district',
                valueCode: await this.cleanedString(region.subdistrictCode),
              },
            ],
          },
        ],
      },
      physicalType: {
        coding: [
          {
            system:
              'http://terminology.hl7.org/CodeSystem/location-physical-type',
            code: 'ro',
            display: 'Room',
          },
        ],
      },
      managingOrganization: {
        reference: `Organization/${room.clinic?.ssOrganizationId}`,
      },
    };

    await this.createLocationApi(token, room.id, locationData);
  }

  async updateLocation(
    payload: RMQBasePayload,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: any,
    header?: any,
  ): Promise<any> {
    //console.log("location.updated")

    const room = await this.gqlRequestService.room({
      id: payload.newData?.id,
    });

    const region = await this.gqlRequestService.region({
      id: room.clinic?.unit?.address?.regionId,
    });

    const token = await this.generateToken();
    const locationData = {
      resourceType: 'Location',
      status: 'active',
      id: room.ssLocationId,
      name: room.name,
      description: room.name,
      mode: 'instance',
      telecom: [
        {
          system: 'phone',
          value: room.clinic?.unit?.phone,
          use: 'work',
        },
        {
          system: 'email',
          value: room.clinic?.unit?.email,
          use: 'work',
        },
        {
          system: 'url',
          value: 'rata.id',
          use: 'work',
        },
      ],
      address: {
        use: 'work',
        line: [room.clinic?.unit?.address.address],
        city: region.city,
        postalCode: region.postcode,
        country: 'ID',
        extension: [
          {
            url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode',
            extension: [
              {
                url: 'province',
                valueCode: await this.cleanedString(region.provinceCode),
              },
              {
                url: 'city',
                valueCode: await this.cleanedString(region.cityCode),
              },
              {
                url: 'district',
                valueCode: await this.cleanedString(region.subdistrictCode),
              },
            ],
          },
        ],
      },
      physicalType: {
        coding: [
          {
            system:
              'http://terminology.hl7.org/CodeSystem/location-physical-type',
            code: 'ro',
            display: 'Room',
          },
        ],
      },
      managingOrganization: {
        reference: `Organization/${room.clinic?.ssOrganizationId}`,
      },
    };

    await this.updateLocationApi(token, room.id, locationData);
  }

  async checkPatientApi(
    payload: RMQBasePayload,
    request: any,
    header?: any,
  ): Promise<any> {
    const fullUrl = this.config.get<string>('SATU_SEHAT_URL_RESOURCE');
    const token = await this.generateToken();

    const customer = await this.gqlRequestService.customer({
      id: payload.newData?.id,
    });

    console.log(customer);

    if (customer?.residentIdNo !== null && customer?.ssPatientId === null) {
      try {
        const response = await axios.get(
          fullUrl +
            'Patient/?identifier=https://fhir.kemkes.go.id/id/nik|' +
            customer.residentIdNo,

          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (
          response.data.total > 0 &&
          response.data.entry &&
          response.data.entry.length > 0
        ) {
          const ihsPatientId = response.data.entry[0].resource.id;
          await this.gqlRequestService.updateCustomerWithoutRmq({
            where: { id: payload.newData?.id },
            data: {
              ssPatientId: ihsPatientId,
            },
          });
        }
      } catch (error) {
        console.log(error);
        console.log(error.response.data);
      }
    }
  }

  async checkPractitionerApi(
    payload: RMQBasePayload,
    request: any,
    header?: any,
  ): Promise<any> {
    const fullUrl = this.config.get<string>('SATU_SEHAT_URL_RESOURCE');

    const practitioner = await this.gqlRequestService.staff({
      id: payload.newData?.id,
    });

    console.log(practitioner);

    if (
      practitioner.residentIdNo !== null &&
      (practitioner.group === 'DOCTOR' || practitioner.group === 'NURSE') &&
      practitioner.ssPractitionerId === null
    ) {
      try {
        const token = await this.generateToken();
        const response = await axios.get(
          fullUrl +
            'Practitioner/?identifier=https://fhir.kemkes.go.id/id/nik|' +
            practitioner.residentIdNo,

          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log(response);

        if (
          response.data.total > 0 &&
          response.data.entry &&
          response.data.entry.length > 0
        ) {
          const ihsPractitionerId = response.data.entry[0].resource.id;
          await this.gqlRequestService.updateStaffWithoutRmq({
            where: { id: payload.newData?.id },
            data: {
              ssPractitionerId: ihsPractitionerId,
            },
          });
        }
      } catch (error) {
        console.log(error);
        console.log(error.response.data);
      }
    }
  }

  async createConditionApi(payload: RMQBasePayload): Promise<any> {
    if (payload.newData.status === InteractionStatus.HANDLING_DONE) {
      const emr = await this.gqlRequestService.emrByInteractionId({
        interactionId: payload.newData?.id,
      });

      const customer = await this.gqlRequestService.customer({
        id: payload.newData?.customerId,
      });

      if (
        customer &&
        customer?.ssPatientId &&
        emr?.interaction?.ssEncounterId &&
        emr?.anamnesis
      ) {
        const codingArray = await Promise.all(
          emr.anamnesis.toothIcd10.map(async (item) => {
            const icd10 = await this.getIcd10Detail(item.icd10Id);
            return {
              code: icd10.code,
              system: 'http://hl7.org/fhir/sid/icd-10',
              display: icd10.title,
            };
          }),
        );

        const fullUrl =
          this.config.get<string>('SATU_SEHAT_URL_RESOURCE') + 'Condition';
        const token = await this.generateToken();
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        };
        const data = {
          resourceType: 'Condition',
          clinicalStatus: {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/condition-clinical',
                code: 'active',
                display: 'Active',
              },
            ],
          },
          category: [
            {
              coding: [
                {
                  system:
                    'http://terminology.hl7.org/CodeSystem/condition-category',
                  code: 'encounter-diagnosis',
                  display: 'Encounter Diagnosis',
                },
              ],
            },
          ],
          code: {
            coding: codingArray,
          },
          subject: {
            reference: `Patient/${customer.ssPatientId}`,
            display: customer.name,
          },
          encounter: {
            reference: `Encounter/${emr.interaction.ssEncounterId}`,
          },
          onsetDateTime: emr.updatedAt,
          recordedDate: emr.updatedAt,
        };

        try {
          const response = await axios.post(fullUrl, data, { headers });

          console.log('response');
          console.log(response);

          let ssConditionIds = emr?.ssConditionIds || [];

          if (!Array.isArray(ssConditionIds)) {
            ssConditionIds = [];
          }

          ssConditionIds.push({
            id: response.data.id,
            note: 'condition diagnosis icd10_tooth',
          });

          await this.gqlRequestService.UpsertEmrByInteractionId({
            interactionId: emr.interaction.id,
            data: {
              ssConditionIds: ssConditionIds,
            },
          });
        } catch (error) {
          console.log(error);
        }
      }
    }
  }

  async updateConditionApi(payload: RMQBasePayload): Promise<any> {
    if (payload.newData.status === InteractionStatus.HANDLING_DONE) {
      const emr = await this.gqlRequestService.emrByInteractionId({
        interactionId: payload.newData?.id,
      });

      const customer = await this.gqlRequestService.customer({
        id: payload.newData?.customerId,
      });

      if (
        customer &&
        customer?.ssPatientId &&
        emr?.interaction?.ssEncounterId &&
        emr?.anamnesis
      ) {
        for (const condition of emr.ssConditionIds) {
          const codingArray = await Promise.all(
            emr.anamnesis.toothIcd10.map(async (item) => {
              const icd10 = await this.getIcd10Detail(item.icd10Id);
              return {
                code: icd10.code,
                system: 'http://hl7.org/fhir/sid/icd-10',
                display: icd10.title,
              };
            }),
          );
          const fullUrl =
            this.config.get<string>('SATU_SEHAT_URL_RESOURCE') +
            'Condition' +
            `/${condition.id}`;
          const token = await this.generateToken();
          const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          };
          const data = {
            resourceType: 'Condition',
            id: `${condition.id}`,
            clinicalStatus: {
              coding: [
                {
                  system:
                    'http://terminology.hl7.org/CodeSystem/condition-clinical',
                  code: 'active',
                  display: 'Active',
                },
              ],
            },
            category: [
              {
                coding: [
                  {
                    system:
                      'http://terminology.hl7.org/CodeSystem/condition-category',
                    code: 'encounter-diagnosis',
                    display: 'Encounter Diagnosis',
                  },
                ],
              },
            ],
            code: {
              coding: codingArray,
            },
            subject: {
              reference: `Patient/${customer.ssPatientId}`,
              display: customer.name,
            },
            encounter: {
              reference: `Encounter/${emr.interaction.ssEncounterId}`,
            },
            onsetDateTime: emr.updatedAt,
            recordedDate: emr.updatedAt,
          };
          try {
            const response = await axios.put(fullUrl, data, { headers });
            console.log(response);
          } catch (error) {
            console.log(error);
            console.log(error.response.data);
          }
        }
      }
    }
  }

  async getIcd10Detail(id: string): Promise<any> {
    const icd10 = await this.gqlRequestService.icd10({
      id: id,
    });
    return icd10;
  }

  async syncConditionSatuSehatApi(
    payload: RMQBasePayload,
    request: any,
    header?: any,
  ): Promise<any> {
    if (payload.newData.status === InteractionStatus.HANDLING_DONE) {
      const emr = await this.gqlRequestService.emrByInteractionId({
        interactionId: payload.newData?.id,
      });

      if (
        !emr.ssConditionIds ||
        (Array.isArray(emr.ssConditionIds) && emr.ssConditionIds.length === 0)
      ) {
        this.createConditionApi(payload);
      } else {
        this.updateConditionApi(payload);
      }
    }
  }
}
