/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { GqlRequestService } from 'src/app/gql-request/gql-request.service';
import { RMQBasePayload } from 'src/common/interfaces/rmq.interface';

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
}
