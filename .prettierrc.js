module.exports = {
  singleQuote: true,
  trailingComma: 'all',
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
  importOrder: ['^@nxs/.*', '^@?generated/.*', '^src/.*', '^[./]'],
  importOrderSortSpecifiers: true,
  importOrderGroupNamespaceSpecifiers: true,
  importOrderSeparation: true,
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],
};
