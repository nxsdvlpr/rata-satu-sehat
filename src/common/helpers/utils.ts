import * as bcrypt from 'bcrypt';
import { existsSync } from 'fs';
import { assign, lowerCase, set, startCase } from 'lodash';
import { resolve } from 'path';
import slugify from 'slugify';

export const buildRmqConfigUri = (config) => {
  // `amqp://${config.get('RABBITMQ_USER')}:${config.get(
  //   'RABBITMQ_PASSWORD',
  // )}@${config.get('RABBITMQ_HOST')}:${config.get('RABBITMQ_PORT')}`;
  const user = config.get('RABBITMQ_USER');
  const password = config.get('RABBITMQ_PASSWORD');
  const host = config.get('RABBITMQ_HOST');
  const port = config.get('RABBITMQ_PORT');

  const vhost = config.get('RABBITMQ_VHOST')
    ? `/${config.get('RABBITMQ_VHOST')}`
    : '';

  const url = `amqp://${user}:${password}@${host}:${port}${vhost}`;

  return url;
};

// loop number from given number and stop to given number
export const loopNumber = (start: number, stop: number): number[] => {
  return Array.from({ length: stop - start + 1 }, (_, i) => start + i);
};

export const buildAddress = (data): string => {
  if (!data) {
    return '';
  }

  let address = '';

  address += data.address;

  if (data.additionalInfo) {
    address += ` (${data.additionalInfo})`;
  }

  if (!data?.region) {
    return address;
  }

  address += `, ${data?.region.subdistrict}, ${data?.region.cityTitle} ${data?.region.city}, ${data.region?.provinceName}, ${data.postcode}`;

  return address;
};

export const splitPeopleName = (name = '') => {
  const [firstName, ...lastName] = name.split(' ').filter(Boolean);
  return {
    firstName: firstName,
    lastName: lastName.join(' ') || '',
  };
};

// get random item from array
export const randomItem = (arr: any[]): any => {
  return arr[Math.floor(Math.random() * arr.length)];
};

// randomize array
export const randomizeArray = (arr: any[]): any[] => {
  return arr.sort(() => Math.random() - 0.5);
};

export const removeDoubleSlash = (string: string): string => {
  return string.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
};

export const getEnvPath = (dest: string, env: string | undefined): string => {
  const fallback: string = resolve(`${dest}/.env`);
  const filename: string = env ? `${env}.env` : 'development.env';
  let filePath: string = resolve(`${dest}/${filename}`);

  if (!existsSync(filePath)) {
    filePath = fallback;
  }

  return filePath;
};

export const zeroLeadPhoneNumber = (phone: string) =>
  phone?.trim().replace(/^\+?62/, '0');

export const formatPhone = (phone: string) =>
  phone
    ?.trim()
    .replace(/\-/g, '')
    .replace(/^0(\d+)/g, '62$1')
    .replace(/^\+?(\d+)/g, '$1');

export const leadingZero = (num, totalLength) =>
  String(num).padStart(totalLength, '0');

export const trailingZero = (num, totalLength) =>
  String(num).padEnd(totalLength, '0');

export const buildStaffTitle = (staff: any) => {
  if (!staff) return '';

  if (staff?.academicTitle && staff?.academicDegree) {
    return `${staff.academicTitle} ${staff.name} ${staff.academicDegree}`;
  } else if (staff?.academicTitle) {
    return `${staff.academicTitle} ${staff.name}`;
  } else if (staff?.academicDegree) {
    return `${staff.name} ${staff.academicDegree}`;
  } else {
    return staff.name;
  }
};

export const makeSlug = (str: string, obj?: any): string =>
  slugify(
    str,
    assign(
      {
        replacement: '-',
        lower: true,
        remove: /[*+~.()//'"!:@#]/g,
      },
      obj,
    ),
  );

export const randomString = (length = 6): string =>
  Math.random().toString(36).substring(2, length);

export const genSalt = (rounds: number, minor: string): string =>
  bcrypt.genSaltSync(rounds, minor);

export const passwordHash = (
  password: string,
  salt: number | string = 10,
): string => bcrypt.hashSync(password, salt);

export const passwordCompare = (password: string, hash: string): string =>
  bcrypt.compareSync(password, hash);

export const JSONStringify = (obj: any) => JSON.stringify(obj, null, 2);

export const titleCase = (str?: string | null) => {
  if (!str) return '';

  return startCase(lowerCase(str));
};

// For each record, transform the fields name to camelCase
export const camelizeKeys = <T>(records: T[]) => {
  return records.map((record) => {
    const newRecord = {};
    for (const key in record) {
      const newKey = key.replace(/_(\w)/g, (m) => m[1].toUpperCase());
      newRecord[newKey] = record[key];
    }
    return newRecord;
  }) as T[];
};

// Generate fake Cuid with seed
export const fakeCuid = (num: number): string => {
  return `cjld2cjxh0000qzrmn8${leadingZero(num, 6)}`;
};

// Generate fake promise
export const fakePromise = (data: any, delay = 0): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const assignWhereArgs = (args: any, obj: any): void => {
  set(args, 'where', {
    AND: [args.where, obj],
  });
};
