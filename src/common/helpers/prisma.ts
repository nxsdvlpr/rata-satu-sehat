import { snakeCase } from 'lodash';

export type DefaultValueType = '[]' | '{}';

const defaultValueTypeMap: Record<DefaultValueType, string> = {
  '[]': "'[]'::jsonb",
  '{}': "'{}'::jsonb",
};

export const alterColumnDefault = async (
  prisma: any,
  tableName: string,
  columnName: string,
  defaultValueType: DefaultValueType,
) => {
  // if (tableName) {
  //   return;
  // }

  const table = snakeCase(tableName);
  const column = snakeCase(columnName);

  const columnDefaultQuery = `
    SELECT column_default
      FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '${table}'
      AND column_name = '${column}';`;

  const columnDefault = await prisma.$queryRawUnsafe(columnDefaultQuery);

  if (!columnDefault.length) {
    console.log(
      `[Alter column default] Column ${column} does not exist on table ${table}`,
    );
    return;
  }

  if (
    columnDefault[0].column_default !== defaultValueTypeMap[defaultValueType]
  ) {
    console.log(
      `[Alter column default] Set default value of column ${column} on table ${table} to ${defaultValueTypeMap[defaultValueType]}`,
    );

    const alterColumnDefaultQuery = `ALTER TABLE ${table} ALTER COLUMN ${column} SET DEFAULT ${defaultValueTypeMap[defaultValueType]};`;
    await prisma.$executeRawUnsafe(alterColumnDefaultQuery);
  }

  await prisma.$disconnect();
};

type ColumnType = 'ltree';

export const alterColumnType = async (
  prisma: any,
  tableName: string,
  columnName: string,
  type: ColumnType,
) => {
  // if (tableName) {
  //   return;
  // }

  const table = snakeCase(tableName);
  const column = snakeCase(columnName);

  const columnTypeMap: Record<ColumnType, string> = {
    ltree: `ltree USING ${column}::ltree `,
  };

  const columnTypeQuery = `
    SELECT data_type
      FROM information_schema.columns
    WHERE table_name = '${table}'
      AND column_name = '${column}';`;

  const columnType = await prisma.$queryRawUnsafe(columnTypeQuery);

  if (!columnType.length) {
    console.log(
      `[Alter column type] Column ${column} does not exist on table ${table}`,
    );
    return;
  }

  if (columnType[0].data_type !== 'USER-DEFINED') {
    console.log(
      `[Alter column type] Set type of column ${column} on table ${table} to ${columnTypeMap[type]}`,
    );

    const alterColumnTypetQuery = `ALTER TABLE ${table} ALTER COLUMN ${column} TYPE ${columnTypeMap[type]};`;
    await prisma.$executeRawUnsafe(alterColumnTypetQuery);
  }

  await prisma.$disconnect();
};
