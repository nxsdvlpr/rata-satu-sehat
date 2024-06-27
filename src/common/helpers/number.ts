/* Convert number to sort string format */
export const prettyNumber = (number: number, digits = 1) => {
  const units = ['K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
  let decimal;

  for (let i = units.length - 1; i >= 0; i--) {
    decimal = Math.pow(1000, i + 1);

    if (number <= -decimal || number >= decimal) {
      return +(number / decimal).toFixed(digits) + units[i];
    }
  }

  return number;
};

export const currencyFormat = (num): string => {
  if (num === null || num === undefined) {
    return '0';
  }

  return num.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};
