/* eslint-disable @typescript-eslint/no-unused-vars */
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { GqlRequestService } from 'src/app/gql-request/gql-request.service';
import { RMQBasePayload } from 'src/common/interfaces/rmq.interface';
import { EncounterStatus } from 'src/constants/encounter';
import { InteractionStatus } from 'src/constants/interaction';

@Injectable()
export class SubscribeService {
  private config = new ConfigService();
  private organizationId = this.config.get<string>(
    'SATU_SEHAT_ORGANIZATION_ID',
  );

  constructor(
    private gqlRequestService: GqlRequestService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

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

  async generateTokenWithCache(): Promise<string> {
    const clientId = this.config.get<string>('SATU_SEHAT_CLIENT_ID');
    const clientSecret = this.config.get<string>('SATU_SEHAT_CLIENT_SECRET');
    const authUrl = this.config.get<string>('SATU_SEHAT_URL_AUTH');

    const satuSehatToken: string = await this.cacheManager.get(
      'satu_sehat_auth_token',
    );

    if (satuSehatToken === null || satuSehatToken === undefined) {
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

      this.cacheManager.set(
        'satu_sehat_auth_token',
        response.data.access_token,
      );

      return response.data.access_token;
    }

    return satuSehatToken;
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
          system: `http://sys-ids.kemkes.go.id/organization/${this.organizationId}`,
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
        reference: `Organization/${this.organizationId}`,
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

          let ssConditionIds = emr?.ssConditionIds || [];

          if (!Array.isArray(ssConditionIds)) {
            ssConditionIds = [];
          }

          ssConditionIds.push({
            id: response.data.id,
            note: 'condition diagnosis icd10_tooth',
          });

          await this.gqlRequestService.upsertEmrByInteractionId({
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

  async getIcd9ByProductId(id: string): Promise<any> {
    const product = await this.gqlRequestService.product({
      id: id,
    });
    return product;
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

  async syncEncounterSatuSehatApi(
    payload: RMQBasePayload,
    request: any,
    header?: any,
  ): Promise<any> {
    console.log(payload);
    // if (payload.newData.status === InteractionStatus.WAITING) {
    //   this.createEncounterapi(payload);
    // } else if (
    //   payload.newData.status === InteractionStatus.ON_HANDLING ||
    //   payload.newData.status === InteractionStatus.HANDLING_DONE
    // ) {
    this.updateEncounterapi(payload);
    // }
  }

  async syncSatuSehat(
    payload: RMQBasePayload,
    request: any,
    header?: any,
  ): Promise<any> {
    if (payload.newData.status === InteractionStatus.HANDLING_DONE) {
      try {
        await this.createBulkEncounterApi(payload);
        console.log('createBulkEncounterApi completed');
      } catch (error) {
        console.error('Error in createBulkEncounterApi:', error);
      }

      try {
        await this.updateBulkEncounterOnHandlingApi(
          payload,
          EncounterStatus.inProgress,
        );
        console.log('updateBulkEncounterOnHandlingApi completed');
      } catch (error) {
        console.error('Error in updateBulkEncounterOnHandlingApi:', error);
      }

      try {
        await this.createBulkConditionApi(payload);
        console.log('createBulkConditionApi completed');
      } catch (error) {
        console.error('Error in createBulkConditionApi:', error);
      }

      try {
        await this.createBulkObservationApi(payload);
      } catch (error) {
        console.error('Error in createBulkObservationApi:', error);
      }

      try {
        await this.createBulkProcedureApi(payload);
      } catch (error) {
        console.error('Error in createBulkProcedureApi:', error);
      }

      try {
        await this.updateBulkEncounterFinishedApi(
          payload,
          EncounterStatus.finished,
        );
      } catch (error) {
        console.error('Error in updateBulkEncounterFinishedApi:', error);
      }
    }
  }

  async createBulkEncounterApi(payload: RMQBasePayload): Promise<any> {
    const interactions = await this.gqlRequestService.interactions({
      where: {
        customerId: {
          equals: payload.newData.customerId,
        },
        status: {
          equals: InteractionStatus.HANDLING_DONE,
        },
        ssEncounterId: {
          equals: null,
        },
      },
    });

    if (interactions.length > 0) {
      for (const interaction of interactions) {
        const interactionLog = await this.gqlRequestService.interactionLog({
          interactionId: interaction.id,
          status: InteractionStatus.WAITING,
        });
        const customer = await this.gqlRequestService.customer({
          id: interaction.customerId,
        });

        if (
          interaction &&
          interaction?.ssEncounterId === null &&
          interaction.staff.ssPractitionerId !== null &&
          customer.ssPatientId !== null &&
          interaction.room.ssLocationId !== null &&
          interactionLog &&
          interactionLog.startAt !== null
        ) {
          const fullUrl =
            this.config.get<string>('SATU_SEHAT_URL_RESOURCE') + 'Encounter';
          const token = await this.generateTokenWithCache();
          const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          };
          const data = {
            resourceType: 'Encounter',
            status: 'arrived',
            class: {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              code: 'AMB',
              display: 'ambulatory',
            },
            subject: {
              reference: `Patient/${customer.ssPatientId}`,
              display: `${customer.name}`,
            },
            participant: [
              {
                type: [
                  {
                    coding: [
                      {
                        system:
                          'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                        code: 'ATND',
                        display: 'attender',
                      },
                    ],
                  },
                ],
                individual: {
                  reference: `Practitioner/${interaction.staff.ssPractitionerId}`,
                  display: `${interaction.staff.name}`,
                },
              },
            ],
            period: {
              start: `${interactionLog.startAt}`,
            },
            location: [
              {
                location: {
                  reference: `Location/${interaction.room.ssLocationId}`,
                  display: `${interaction.room.name}`,
                },
              },
            ],
            statusHistory: [
              {
                status: 'arrived',
                period: {
                  start: `${interactionLog.startAt}`,
                },
              },
            ],
            serviceProvider: {
              reference: `Organization/${this.organizationId}`,
            },
            identifier: [
              {
                system: `http://sys-ids.kemkes.go.id/encounter/${this.organizationId}`,
              },
            ],
          };

          try {
            const response = await axios.post(fullUrl, data, { headers });
            await this.gqlRequestService.updateInteractionWithoutRmq({
              where: { id: interaction.id },
              data: {
                ssEncounterId: response.data.id,
              },
            });
          } catch (error) {
            console.log(interaction.id);
            console.log(error.response.data);
          }
        }
      }
    }
  }

  async updateBulkEncounterOnHandlingApi(
    payload: RMQBasePayload,
    status: string,
  ): Promise<any> {
    const interactions = await this.gqlRequestService.interactions({
      where: {
        customerId: {
          equals: payload.newData.customerId,
        },
        status: {
          equals: InteractionStatus.HANDLING_DONE,
        },
      },
    });

    if (interactions.length > 0) {
      for (const interaction of interactions) {
        const interactionLog = await this.gqlRequestService.interactionLog({
          interactionId: interaction.id,
          status: interaction.status,
        });
        const statusHistory = await Promise.all(
          interaction.interactionLogs.map(async (item) => {
            let statusValue: string = '';
            if (item.status === InteractionStatus.WAITING) {
              statusValue = EncounterStatus.arrived;
            }
            if (item.status === InteractionStatus.ON_HANDLING) {
              statusValue = EncounterStatus.inProgress;
            }
            if (item.status === InteractionStatus.HANDLING_DONE) {
              statusValue = EncounterStatus.finished;
            }
            return {
              status: statusValue,
              period: {
                start: item.startAt,
                end: item.endAt,
              },
            };
          }),
        );
        const customer = await this.gqlRequestService.customer({
          id: interaction.customerId,
        });
        if (
          interaction &&
          interaction?.ssEncounterId !== null &&
          interaction.staff.ssPractitionerId !== null &&
          customer.ssPatientId !== null &&
          interaction.room.ssLocationId !== null &&
          interactionLog &&
          interactionLog.startAt !== null
        ) {
          console.log('update encounter on handling');
          console.log(interaction.id);
          const fullUrl =
            this.config.get<string>('SATU_SEHAT_URL_RESOURCE') +
            'Encounter/' +
            `${interaction?.ssEncounterId}`;
          const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await this.generateTokenWithCache()}`,
          };
          const data = {
            resourceType: 'Encounter',
            id: `${interaction?.ssEncounterId}`,
            status: `${status}`,
            class: {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              code: 'AMB',
              display: 'ambulatory',
            },
            subject: {
              reference: `Patient/${customer.ssPatientId}`,
              display: `${customer.name}`,
            },
            participant: [
              {
                type: [
                  {
                    coding: [
                      {
                        system:
                          'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                        code: 'ATND',
                        display: 'attender',
                      },
                    ],
                  },
                ],
                individual: {
                  reference: `Practitioner/${interaction.staff.ssPractitionerId}`,
                  display: `${interaction.staff.name}`,
                },
              },
            ],
            period: {
              start: `${interactionLog.startAt}`,
              end: `${interactionLog.endAt}`,
            },
            location: [
              {
                location: {
                  reference: `Location/${interaction.room.ssLocationId}`,
                  display: `${interaction.room.name}`,
                },
              },
            ],
            statusHistory: statusHistory,
            serviceProvider: {
              reference: `Organization/${this.organizationId}`,
            },
            identifier: [
              {
                system: `http://sys-ids.kemkes.go.id/encounter/${this.organizationId}`,
              },
            ],
          };
          try {
            const response = await axios.put(fullUrl, data, { headers });
            await this.gqlRequestService.updateInteractionWithoutRmq({
              where: { id: interaction.id },
              data: {
                ssEncounterId: response.data.id,
              },
            });
          } catch (error) {
            console.log(interaction.id);
            console.log(error.response.data);
          }
        }
      }
    }
  }

  async updateBulkEncounterFinishedApi(
    payload: RMQBasePayload,
    status: string,
  ): Promise<any> {
    const interactions = await this.gqlRequestService.interactions({
      where: {
        customerId: {
          equals: payload.newData.customerId,
        },
        status: {
          equals: InteractionStatus.HANDLING_DONE,
        },
      },
    });

    if (interactions.length > 0) {
      for (const interaction of interactions) {
        const interactionLog = await this.gqlRequestService.interactionLog({
          interactionId: interaction.id,
          status: interaction.status,
        });
        const statusHistory = await Promise.all(
          interaction.interactionLogs.map(async (item) => {
            let statusValue: string = '';
            if (item.status === InteractionStatus.WAITING) {
              statusValue = EncounterStatus.arrived;
            }
            if (item.status === InteractionStatus.ON_HANDLING) {
              statusValue = EncounterStatus.inProgress;
            }
            if (item.status === InteractionStatus.HANDLING_DONE) {
              statusValue = EncounterStatus.finished;
            }
            return {
              status: statusValue,
              period: {
                start: item.startAt,
                end: item.endAt,
              },
            };
          }),
        );
        const customer = await this.gqlRequestService.customer({
          id: interaction.customerId,
        });
        if (
          interaction &&
          interaction?.ssEncounterId !== null &&
          interaction.staff.ssPractitionerId !== null &&
          customer.ssPatientId !== null &&
          interaction.room.ssLocationId !== null &&
          interactionLog &&
          interactionLog.startAt !== null &&
          interaction.emr !== null &&
          interaction.emr.ssConditionIds &&
          interaction.emr.ssConditionIds.length !== 0
        ) {
          const fullUrl =
            this.config.get<string>('SATU_SEHAT_URL_RESOURCE') +
            'Encounter/' +
            `${interaction?.ssEncounterId}`;
          const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await this.generateTokenWithCache()}`,
          };
          const data = {
            resourceType: 'Encounter',
            id: `${interaction?.ssEncounterId}`,
            status: `${status}`,
            class: {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              code: 'AMB',
              display: 'ambulatory',
            },
            subject: {
              reference: `Patient/${customer.ssPatientId}`,
              display: `${customer.name}`,
            },
            participant: [
              {
                type: [
                  {
                    coding: [
                      {
                        system:
                          'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                        code: 'ATND',
                        display: 'attender',
                      },
                    ],
                  },
                ],
                individual: {
                  reference: `Practitioner/${interaction.staff.ssPractitionerId}`,
                  display: `${interaction.staff.name}`,
                },
              },
            ],
            period: {
              start: `${interactionLog.startAt}`,
              end: `${interactionLog.endAt}`,
            },
            location: [
              {
                location: {
                  reference: `Location/${interaction.room.ssLocationId}`,
                  display: `${interaction.room.name}`,
                },
              },
            ],
            diagnosis: [
              {
                condition: {
                  reference: `Condition/${interaction.emr.ssConditionIds[0]?.id}`,
                },
              },
            ],
            statusHistory: statusHistory,
            serviceProvider: {
              reference: `Organization/${this.organizationId}`,
            },
            identifier: [
              {
                system: `http://sys-ids.kemkes.go.id/encounter/${this.organizationId}`,
              },
            ],
          };
          try {
            const response = await axios.put(fullUrl, data, { headers });
            await this.gqlRequestService.updateInteractionWithoutRmq({
              where: { id: interaction.id },
              data: {
                ssEncounterId: response.data.id,
              },
            });
          } catch (error) {
            console.log(interaction.id);
            console.log(error.response.data);
          }
        }
      }
    }
  }

  async createBulkConditionApi(payload: RMQBasePayload): Promise<any> {
    const interactions = await this.gqlRequestService.interactions({
      where: {
        customerId: {
          equals: payload.newData.customerId,
        },
        status: {
          equals: InteractionStatus.HANDLING_DONE,
        },
      },
    });

    if (interactions.length > 0) {
      for (const interaction of interactions) {
        const customer = await this.gqlRequestService.customer({
          id: interaction.customerId,
        });

        if (
          customer &&
          customer?.ssPatientId &&
          interaction?.ssEncounterId !== null &&
          interaction?.emr !== null &&
          interaction?.emr?.anamnesis !== null &&
          (!interaction.emr.ssConditionIds ||
            (Array.isArray(interaction.emr.ssConditionIds) &&
              interaction.emr.ssConditionIds.length === 0)) &&
          (!interaction.emr.anamnesis.toothIcd10 ||
            (Array.isArray(interaction.emr.anamnesis.toothIcd10) &&
              interaction.emr.anamnesis.toothIcd10.length !== 0))
        ) {
          const codingArray = await Promise.all(
            interaction?.emr.anamnesis.toothIcd10.map(async (item) => {
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
          const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await this.generateTokenWithCache()}`,
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
              reference: `Encounter/${interaction.ssEncounterId}`,
            },
            onsetDateTime: interaction.emr.updatedAt,
            recordedDate: interaction.emr.updatedAt,
          };

          try {
            const response = await axios.post(fullUrl, data, { headers });

            let ssConditionIds = interaction?.emr.ssConditionIds || [];

            if (!Array.isArray(ssConditionIds)) {
              ssConditionIds = [];
            }

            ssConditionIds.push({
              id: response.data.id,
              note: 'condition diagnosis icd10_tooth',
            });

            await this.gqlRequestService.upsertEmrByInteractionId({
              interactionId: interaction.id,
              data: {
                ssConditionIds: ssConditionIds,
              },
            });
          } catch (error) {
            console.log(interaction.emr.id);
            console.log(error.response.data);
          }
        }
      }
    }
  }

  async createBulkObservationApi(payload: RMQBasePayload): Promise<any> {
    const interactions = await this.gqlRequestService.interactions({
      where: {
        customerId: {
          equals: payload.newData.customerId,
        },
        status: {
          equals: InteractionStatus.HANDLING_DONE,
        },
      },
    });

    if (interactions.length > 0) {
      for (const interaction of interactions) {
        const customer = await this.gqlRequestService.customer({
          id: interaction.customerId,
        });
        if (
          interaction &&
          interaction?.ssEncounterId !== null &&
          interaction.staff.ssPractitionerId !== null &&
          interaction?.emr !== null &&
          interaction?.emr?.anamnesis !== null &&
          customer.ssPatientId !== null &&
          (!interaction.emr.ssObservationIds ||
            (Array.isArray(interaction.emr.ssObservationIds) &&
              interaction.emr.ssObservationIds.length === 0)) &&
          (!interaction.emr.anamnesis.odontogram ||
            (Array.isArray(interaction.emr.anamnesis.odontogram) &&
              interaction.emr.anamnesis.odontogram.length !== 0))
        ) {
          type Item = {
            id: string;
            code: string;
            notes: string;
            sectionNo: string;
            snowmedCode: string;
            snowmedDisplay: string;
          };
          const groupedBySectionNo =
            interaction.emr.anamnesis.odontogram.reduce(
              (acc, item) => {
                const section = item.sectionNo;
                if (!acc[section]) {
                  acc[section] = {};
                }
                acc[section][item.code] = item;
                return acc;
              },
              {} as { [key: string]: { [code: string]: Item } },
            );
          const groupedBySectionNoArray = Object.entries(
            groupedBySectionNo,
          ).reduce(
            (acc, [section, items]) => {
              acc[section] = Object.values(items);
              return acc;
            },
            {} as { [key: string]: Item[] },
          );
          for (const [sectionNo, items] of Object.entries(
            groupedBySectionNoArray,
          )) {
            const mappedItems = items.map((item) => ({
              system: 'http://snomed.info/sct',
              code: item.snowmedCode,
              display: item.snowmedDisplay,
            }));
            const fullUrl =
              this.config.get<string>('SATU_SEHAT_URL_RESOURCE') +
              'Observation';
            const headers = {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await this.generateTokenWithCache()}`,
            };
            const data = {
              resourceType: 'Observation',
              status: 'final',
              category: [
                {
                  coding: [
                    {
                      system:
                        'http://terminology.hl7.org/CodeSystem/observation-category',
                      code: 'exam',
                      display: 'Exam',
                    },
                  ],
                },
              ],
              code: {
                coding: [
                  {
                    system:
                      'http://terminology.kemkes.go.id/CodeSystem/clinical-term',
                    code: 'OC000061',
                    display: 'Pemeriksaan Odontogram',
                  },
                ],
              },
              subject: {
                reference: `Patient/${customer.ssPatientId}`,
                display: `${customer.name}`,
              },
              encounter: {
                reference: `Encounter/${interaction.ssEncounterId}`,
              },
              effectiveDateTime: `${interaction.emr.updatedAt}`,
              issued: `${interaction.emr.updatedAt}`,
              performer: [
                {
                  reference: `Practitioner/${interaction.staff.ssPractitionerId}`,
                  display: `${interaction.staff.name}`,
                },
              ],
              bodySite: {
                coding: mappedItems,
              },
            };
            try {
              const response = await axios.post(fullUrl, data, { headers });
              let ssObservationIds = interaction.emr?.ssObservationIds || [];
              if (!Array.isArray(ssObservationIds)) {
                ssObservationIds = [];
              }
              ssObservationIds.push({
                id: response.data.id,
                sectionNo: sectionNo,
                note: `Odontogram Tooth ${sectionNo}`,
              });
              await this.gqlRequestService.upsertEmrByInteractionId({
                interactionId: interaction.id,
                data: {
                  ssObservationIds: ssObservationIds,
                },
              });
            } catch (error) {
              console.log(interaction.emr.id);
              console.log(error.response.data);
            }
          }
        }
      }
    }
  }

  async createBulkProcedureApi(payload: RMQBasePayload): Promise<any> {
    const interactions = await this.gqlRequestService.interactions({
      where: {
        customerId: {
          equals: payload.newData.customerId,
        },
        status: {
          equals: InteractionStatus.HANDLING_DONE,
        },
      },
    });

    if (interactions.length > 0) {
      for (const interaction of interactions) {
        const customer = await this.gqlRequestService.customer({
          id: interaction.customerId,
        });
        if (
          interaction &&
          interaction?.ssEncounterId !== null &&
          interaction.staff.ssPractitionerId !== null &&
          interaction.slip !== null &&
          customer.ssPatientId !== null &&
          (!interaction.slip.ssProcedureIds ||
            (Array.isArray(interaction.slip.ssProcedureIds) &&
              interaction.slip.ssProcedureIds.length === 0))
        ) {
          const codingArray = await Promise.all(
            interaction?.slip.slipItems.map(async (item) => {
              const product = await this.getIcd9ByProductId(item.productId);
              return product.icd9.map((icd9Item) => ({
                system: 'http://hl7.org/fhir/sid/icd-9-cm',
                code: icd9Item.icd9code,
                display: icd9Item.icd9value,
              }));
            }),
          );
          if (codingArray.flat().length !== 0) {
            const fullUrl =
              this.config.get<string>('SATU_SEHAT_URL_RESOURCE') + 'Procedure';
            const headers = {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await this.generateTokenWithCache()}`,
            };
            const data = {
              resourceType: 'Procedure',
              status: 'completed',
              code: {
                coding: codingArray.flat(),
              },
              subject: {
                reference: `Patient/${customer.ssPatientId}`,
                display: `${customer.name}`,
              },
              encounter: {
                reference: `Encounter/${interaction.ssEncounterId}`,
              },
              performedPeriod: {
                start: `${interaction.slip.createdAt}`,
                end: `${interaction.slip.updatedAt}`,
              },
              performer: [
                {
                  actor: {
                    reference: `Practitioner/${interaction.staff.ssPractitionerId}`,
                    display: `${interaction.staff.name}`,
                  },
                },
              ],
            };
            try {
              const response = await axios.post(fullUrl, data, { headers });
              let ssProcedureIds = interaction.slip?.ssProcedureIds || [];
              if (!Array.isArray(ssProcedureIds)) {
                ssProcedureIds = [];
              }
              ssProcedureIds.push({
                id: response.data.id,
              });
              await this.gqlRequestService.updateSlipByInteractionId({
                interactionId: interaction.id,
                data: {
                  ssProcedureIds: ssProcedureIds,
                },
              });
            } catch (error) {
              console.log(interaction.slip.id);
              console.log(error.response.data);
            }
          }
        }
      }
    }
  }

  async createEncounterApi(payload: RMQBasePayload): Promise<any> {
    const interaction = await this.gqlRequestService.interaction({
      id: payload.newData?.id,
    });

    const interactionLog = await this.gqlRequestService.interactionLog({
      interactionId: payload.newData?.id,
      status: InteractionStatus.WAITING,
    });

    const customer = await this.gqlRequestService.customer({
      id: interaction.customerId,
    });

    if (
      interaction &&
      interaction?.ssEncounterId === null &&
      interaction.staff.ssPractitionerId !== null &&
      customer.ssPatientId !== null &&
      interaction.room.ssLocationId !== null &&
      interactionLog &&
      interactionLog.startAt !== null
    ) {
      const fullUrl =
        this.config.get<string>('SATU_SEHAT_URL_RESOURCE') + 'Encounter';
      const token = await this.generateToken();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const data = {
        resourceType: 'Encounter',
        status: 'arrived',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'ambulatory',
        },
        subject: {
          reference: `Patient/${customer.ssPatientId}`,
          display: `${customer.name}`,
        },
        participant: [
          {
            type: [
              {
                coding: [
                  {
                    system:
                      'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                    code: 'ATND',
                    display: 'attender',
                  },
                ],
              },
            ],
            individual: {
              reference: `Practitioner/${interaction.staff.ssPractitionerId}`,
              display: `${interaction.staff.name}`,
            },
          },
        ],
        period: {
          start: `${interactionLog.startAt}`,
        },
        location: [
          {
            location: {
              reference: `Location/${interaction.room.ssLocationId}`,
              display: `${interaction.room.name}`,
            },
          },
        ],
        statusHistory: [
          {
            status: 'arrived',
            period: {
              start: `${interactionLog.startAt}`,
            },
          },
        ],
        serviceProvider: {
          reference: `Organization/${this.organizationId}`,
        },
        identifier: [
          {
            system: `http://sys-ids.kemkes.go.id/encounter/${this.organizationId}`,
          },
        ],
      };

      try {
        const response = await axios.post(fullUrl, data, { headers });
        await this.gqlRequestService.updateInteractionWithoutRmq({
          where: { id: payload.newData?.id },
          data: {
            ssEncounterId: response.data.id,
          },
        });
      } catch (error) {
        console.log(error.response.data);
      }
    }
  }

  async updateEncounterapi(payload: RMQBasePayload): Promise<any> {
    let statusValue: string = '';

    const interaction = await this.gqlRequestService.interaction({
      id: payload.newData?.id,
    });

    const interactionLog = await this.gqlRequestService.interactionLog({
      interactionId: payload.newData?.id,
      status: payload.newData.status,
    });

    if (payload.newData.status === InteractionStatus.ON_HANDLING) {
      statusValue = 'in-progress';
    }

    if (payload.newData.status === InteractionStatus.HANDLING_DONE) {
      statusValue = 'finished';
    }

    const statusHistory = await Promise.all(
      interaction.interactionLogs.map(async (item) => {
        return {
          status: statusValue,
          period: {
            start: item.startAt,
            end: item.endAt,
          },
        };
      }),
    );

    const customer = await this.gqlRequestService.customer({
      id: interaction.customerId,
    });

    if (
      interaction &&
      interaction?.ssEncounterId !== null &&
      interaction.staff.ssPractitionerId !== null &&
      customer.ssPatientId !== null &&
      interaction.room.ssLocationId !== null &&
      interactionLog &&
      interactionLog.startAt !== null
    ) {
      const fullUrl =
        this.config.get<string>('SATU_SEHAT_URL_RESOURCE') +
        'Encounter/' +
        `${interaction?.ssEncounterId}`;
      const token = await this.generateToken();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const data = {
        resourceType: 'Encounter',
        id: `${interaction?.ssEncounterId}`,
        status: `${statusValue}`,
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'ambulatory',
        },
        subject: {
          reference: `Patient/${customer.ssPatientId}`,
          display: `${customer.name}`,
        },
        participant: [
          {
            type: [
              {
                coding: [
                  {
                    system:
                      'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                    code: 'ATND',
                    display: 'attender',
                  },
                ],
              },
            ],
            individual: {
              reference: `Practitioner/${interaction.staff.ssPractitionerId}`,
              display: `${interaction.staff.name}`,
            },
          },
        ],
        period: {
          start: `${interactionLog.startAt}`,
          end: `${interactionLog.endAt}`,
        },
        location: [
          {
            location: {
              reference: `Location/${interaction.room.ssLocationId}`,
              display: `${interaction.room.name}`,
            },
          },
        ],
        statusHistory: statusHistory,
        serviceProvider: {
          reference: `Organization/${this.organizationId}`,
        },
        identifier: [
          {
            system: `http://sys-ids.kemkes.go.id/encounter/${this.organizationId}`,
          },
        ],
      };

      try {
        const response = await axios.put(fullUrl, data, { headers });
        await this.gqlRequestService.updateInteractionWithoutRmq({
          where: { id: payload.newData?.id },
          data: {
            ssEncounterId: response.data.id,
          },
        });
      } catch (error) {
        console.log(error.response.data);
      }
    }
  }

  async createObservationApi(payload: RMQBasePayload): Promise<any> {
    if (payload.newData.status === InteractionStatus.HANDLING_DONE) {
      const interaction = await this.gqlRequestService.interaction({
        id: payload.newData?.id,
      });

      const customer = await this.gqlRequestService.customer({
        id: payload.newData?.customerId,
      });

      if (
        interaction &&
        interaction?.ssEncounterId === null &&
        interaction.staff.ssPractitionerId !== null &&
        interaction.emr.anamnesis &&
        customer.ssPatientId !== null &&
        (!interaction.emr.anamnesis.odontogram ||
          (Array.isArray(interaction.emr.anamnesis.odontogram) &&
            interaction.emr.anamnesis.odontogram.length === 0))
      ) {
        type Item = {
          id: string;
          code: string;
          notes: string;
          sectionNo: string;
          snowmedCode: string;
        };

        const groupedBySectionNo = interaction.emr.anamnesis.odontogram.reduce(
          (acc, item) => {
            const section = item.sectionNo;
            if (!acc[section]) {
              acc[section] = {};
            }
            acc[section][item.code] = item;
            return acc;
          },
          {} as { [key: string]: { [code: string]: Item } },
        );

        const groupedBySectionNoArray = Object.entries(
          groupedBySectionNo,
        ).reduce(
          (acc, [section, items]) => {
            acc[section] = Object.values(items);
            return acc;
          },
          {} as { [key: string]: Item[] },
        );

        for (const [sectionNo, items] of Object.entries(
          groupedBySectionNoArray,
        )) {
          const mappedItems = items.map((item) => ({
            system: 'http://snomed.info/sct',
            code: item.snowmedCode,
            display: '',
          }));

          const fullUrl =
            this.config.get<string>('SATU_SEHAT_URL_RESOURCE') + 'Observation';
          const token = await this.generateToken();
          const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          };

          const data = {
            resourceType: 'Observation',
            status: 'final',
            category: [
              {
                coding: [
                  {
                    system:
                      'http://terminology.hl7.org/CodeSystem/observation-category',
                    code: 'exam',
                    display: 'Exam',
                  },
                ],
              },
            ],
            code: {
              coding: [
                {
                  system:
                    'http://terminology.kemkes.go.id/CodeSystem/clinical-term',
                  code: 'OC000061',
                  display: 'Pemeriksaan Odontogram',
                },
              ],
            },
            subject: {
              reference: `Patient/${customer.ssPatientId}`,
              display: `${customer.name}`,
            },
            encounter: {
              reference: `Encounter/${interaction.ssEncounterId}`,
            },
            effectiveDateTime: `${interaction.emr.updatedAt}`,
            issued: `${interaction.emr.updatedAt}`,
            performer: [
              {
                reference: `Practitioner/${interaction.staff.ssPractitionerId}`,
                display: `${interaction.staff.name}`,
              },
            ],
            bodySite: {
              coding: mappedItems,
            },
          };

          try {
            const response = await axios.post(fullUrl, data, { headers });
            let ssObservationIds = interaction.emr?.ssObservationIds || [];

            if (!Array.isArray(ssObservationIds)) {
              ssObservationIds = [];
            }

            ssObservationIds.push({
              id: response.data.id,
              sectionNo: sectionNo,
              note: `Odontgram Tooth ${sectionNo}`,
            });

            await this.gqlRequestService.upsertEmrByInteractionId({
              interactionId: interaction.emr.id,
              data: {
                ssObservationIds: ssObservationIds,
              },
            });
          } catch (error) {
            console.log(error.response?.data);
          }
        }
      }
    }
  }
}
