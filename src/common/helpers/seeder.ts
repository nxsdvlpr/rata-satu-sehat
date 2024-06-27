import * as md5 from 'md5';
import { chunk } from 'lodash';

export const createRecords = async (options: {
  prisma: any;
  entity: string;
  recordCount?: number;
  baseData?: any[];
  beforeCreate?: (record: any, index: number) => any;
  afterCreate?: (record: any, index: number) => any;
}) => {
  const records: Array<any> = options?.baseData || [];

  const recordCount = options?.recordCount || 10;

  if (!options?.baseData) {
    for (let i = 1; i <= recordCount; i++) {
      records.push({
        id: md5(`${options.entity}_${i}`).substr(0, 25),
      });
    }
  }

  const chunkRecords = chunk(records, 10);

  const results = [];

  let recordsIndex = 0;
  for (let index = 0; index < chunkRecords.length; index++) {
    const chunkResults = await Promise.all(
      chunkRecords[index].map(async (record) => {
        const originalRecord = JSON.parse(JSON.stringify({ ...record }));

        recordsIndex++;

        if (typeof options?.beforeCreate === 'function')
          options.beforeCreate(originalRecord, recordsIndex - 1);

        const newRecord = await options.prisma[options.entity].create({
          data: originalRecord,
        });

        if (typeof options?.afterCreate === 'function')
          options.afterCreate(newRecord, recordsIndex - 1);

        return newRecord;
      }),
    );

    for (let i = 0; i < chunkResults.length; i++) {
      results.push(chunkResults[i]);
    }
  }

  return results;
};
