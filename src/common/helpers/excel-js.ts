export const excelInsertRow = (
  worksheet,
  rowStart,
  column,
  data,
  name = '',
): void => {
  let start = rowStart;
  for (let i = 0; i < data.length; i++) {
    const element = data[i];
    const cell = worksheet.getCell(`${column}${start}`);
    cell.value = element;
    if (name !== '') {
      cell.name = name.replace(/\s/g, '_');
    }

    start++;
  }
};

export const excelAutoWidth = (worksheet, minimalWidth = 15): void => {
  worksheet.columns.forEach((column) => {
    let maxColumnLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      maxColumnLength = Math.max(
        maxColumnLength,
        minimalWidth,
        cell.value ? cell.value.toString().length : 0,
      );
    });
    column.width = maxColumnLength + 5;
  });
};

export const excelFormatColumn = (worksheet): void => {
  worksheet.columns.forEach(function (column) {
    let maxLength = 0;
    column['eachCell']({ includeEmpty: true }, function (cell) {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 10 ? 10 : maxLength;
    column.alignment = { vertical: 'middle', horizontal: 'left' };
    column.font = {
      name: 'Calibri',
      size: 12,
    };
  });
};

export const removeHyperlink = (data: any) => {
  if (typeof data === 'object') {
    return data?.text;
  }

  return data;
};
