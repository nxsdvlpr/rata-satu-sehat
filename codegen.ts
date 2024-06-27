import type { CodegenConfig } from '@graphql-codegen/cli';

const patchImport =
  'perl -i -pe"s|graphql-request/dist/types.dom|graphql-request/src/types.dom|g"';

const plugins = [
  'typescript',
  'typescript-operations',
  'typescript-graphql-request',
];

const hooks = {
  afterOneFileWrite: [patchImport],
};

const workspaceConfig = { federation: true };

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.GATEWAY_SERVICE_ENPOINT,
  documents: ['src/app/**/*.gql'],
  ignoreNoDocuments: true,
  generates: {
    './generated/gql/gql.ts': {
      plugins,
      hooks,
      config: workspaceConfig,
    },
  },
};

export default config;
