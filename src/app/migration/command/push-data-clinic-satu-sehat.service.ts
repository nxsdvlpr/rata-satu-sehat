import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export class PushDataClinicSatuSehatService {
  private config = new ConfigService();
  private enabledClinicIdSatuSehat: string[];
  constructor() {}

  async runSatuSehatOrganizationSync(gqlRequestService: any): Promise<void> {
    const organizationId = this.config.get<string>(
      'SATU_SEHAT_ORGANIZATION_ID',
    );

    const enabledClinicIdSatuSehatString = this.config.get<string>(
      'ENABLED_CLINIC_ID_SATU_SEHAT',
    );
    this.enabledClinicIdSatuSehat = enabledClinicIdSatuSehatString
      ? enabledClinicIdSatuSehatString.split(',')
      : [];

    // const clinics = await gqlRequestService.clinics({
    //   OR : [
    //       {
    //       where : {
    //         id : "cltdrgi7m2px19y9gbdwky550"
    //       }
    //       },
    //       {
    //         where : {
    //           id : "cltdowrgm000r9y9gtfqif67k"
    //         }
    //       }
    //   ]
    // });

    // const clinics = await gqlRequestService.clinics({
    //   where: {
    //     id: { equals: "cltdowrgm000r9y9gtfqif67k" }
    //   }
    // });

    const clinics = await gqlRequestService.clinics({
      first: 100000,
    });

    // let number: number = 0

    const token = await this.generateToken();
    for (const clinic of clinics) {
      if (
        clinic.unit?.address?.regionId &&
        clinic.ssLocationId === null &&
        clinic.ssOrganizationId === null &&
        (await this.checkClinicIdSatuSehat(clinic.id))
      ) {
        const region = await this.getRegion(
          gqlRequestService,
          clinic.unit.address.regionId,
        );

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
                  system:
                    'http://terminology.hl7.org/CodeSystem/organization-type',
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
                      valueCode: await this.cleanedString(
                        region.subdistrictCode,
                      ),
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

        await this.createOrganization(
          token,
          clinic.id,
          gqlRequestService,
          organizationData,
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

  async createOrganization(
    token: string,
    clinicId: string,
    gqlRequestService: any,
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

      console.log(response);

      await gqlRequestService.updateClinicWithoutRmq({
        where: { id: clinicId },
        data: {
          ssOrganizationId: response.data.id,
        },
      });

      locationData.managingOrganization.reference = `Organization/${response.data.id}`;

      try {
        await this.createLocation(
          token,
          clinicId,
          locationData,
          gqlRequestService,
        );
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

  async createLocation(
    token: string,
    clinicId: string,
    locationData: any,
    gqlRequestService: any,
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

      await gqlRequestService.updateClinicWithoutRmq({
        where: { id: clinicId },
        data: {
          ssLocationId: response.data.id,
        },
      });
    } catch (error) {
      console.log(error);
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
