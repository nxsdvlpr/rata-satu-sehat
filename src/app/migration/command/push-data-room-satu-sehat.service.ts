import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export class PushDataRoomSatuSehatService {
  private config = new ConfigService();
  private enabledClinicIdSatuSehat: string[];
  constructor() {}

  async runSatuSehatRoomSync(gqlRequestService: any): Promise<void> {
    const rooms = await gqlRequestService.rooms({
      first: 10000,
    });

    const enabledClinicIdSatuSehatString = this.config.get<string>(
      'ENABLED_CLINIC_ID_SATU_SEHAT',
    );
    this.enabledClinicIdSatuSehat = enabledClinicIdSatuSehatString
      ? enabledClinicIdSatuSehatString.split(',')
      : [];

    const token = await this.generateToken();
    for (const room of rooms) {
      if (
        room.clinic?.unit?.address?.regionId &&
        room.ssLocationId === null &&
        room.clinic.ssOrganizationId !== null &&
        (await this.checkClinicIdSatuSehat(room.clinic.id))
      ) {
        const region = await this.getRegion(
          gqlRequestService,
          room.clinic?.unit?.address?.regionId,
        );

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

        await this.createLocation(
          token,
          room.id,
          gqlRequestService,
          locationData,
        );
      }
    }
  }

  async getRegion(gqlRequestService: any, id: any): Promise<any> {
    const region = await gqlRequestService.region({
      id: id,
    });
    return region;
  }

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

  async createLocation(
    token: string,
    roomId: string,
    gqlRequestService: any,
    locationData: any,
  ): Promise<void> {
    const locationUrl = this.config.get<string>('SATU_SEHAT_URL_RESOURCE');
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

      await gqlRequestService.updateRoomWithoutRmq({
        where: { id: roomId },
        data: {
          ssLocationId: response.data.id,
        },
      });
    } catch (error) {
      console.log('Error creating location for room:', roomId);
      //console.log(error);
      console.log(error.response.data);
    }
  }

  async cleanedString(code: string): Promise<string> {
    return code.replace(/\./g, '');
  }

  async checkClinicIdSatuSehat(clinicId: string): Promise<boolean> {
    return this.enabledClinicIdSatuSehat.includes(clinicId);
  }
}
