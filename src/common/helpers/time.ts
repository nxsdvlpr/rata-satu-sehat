import { format, isValid, parse, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

// Date format for display
export const DATE_DISPLAY = 'dd/MM/y';

export const DATE_WORD = 'dd MMMM y';

export const DATETIME_DISPLAY = 'dd/MM/y HH:mm';

export const DATE_DB = 'yyyy-MM-dd';

export const DATE_JURNALID = 'dd-MM-yyyy';

export const DATE_LOCALE = id;

export const halfHourToTime = (halfHour: number) => {
  const hour = Math.floor(halfHour / 2);
  const minute = halfHour % 2 === 0 ? '00' : '30';

  return `${hour.toString().padStart(2, '0')}.${minute}`;
};

export const timeToHalfHour = (time: string) => {
  const [hour, minute] = time.split(':');
  const halfHour =
    parseInt(hour, 10) * 2 + (parseInt(minute, 10) === 30 ? 1 : 0);
  return halfHour;
};

// Get today date
export const today = () => {
  return new Date();
};

// Get yesterday date
export const yesterday = () => {
  const date = today();
  date.setDate(date.getDate() - 1);
  return date;
};

// Get tomorrow date
export const tomorrow = () => {
  const date = today();
  date.setDate(date.getDate() + 1);
  return date;
};

// Format string date to date only with zero timezone
export const formatDateOnly = (strDate: string) => {
  if (!strDate) return '';
  return `${strDate}T00:00:00.000Z`;
};

// Format date to string based on DATE_FORMAT
export const formatDatetime = (date?: Date, datetimeFormat = DATE_DISPLAY) => {
  if (!date) return '';

  const parsedIso = parseISO(date.toISOString());
  const formated = format(parsedIso, datetimeFormat);

  return formated;
};

// Parse javascript date to date only without timezone
export const formatDate = (date?: Date, dateFormat = DATE_DISPLAY) => {
  if (!date) return '';

  const dateToIso = date.toISOString();
  const parsedIso = parseISO(dateToIso);
  const formated = `${format(parsedIso, dateFormat)}`;

  return formated;
};

// Format date to date only ISO string
// Timezone is set to 00:00:00.000Z
export const formatDateISO = (date?: Date) => {
  if (!date) return '';

  const dateToIso = date.toISOString();
  const parsedIso = parseISO(dateToIso);
  const formated = `${format(parsedIso, 'yyyy-MM-dd')}T00:00:00.000Z`;

  return formated;
};

// Parse javascript date to date only without timezone
// Return date object with timezone set to 00:00:00.000Z
export const parseDate = (date: Date | string) => {
  let toParsedDate = null;
  if (typeof date === 'string') {
    toParsedDate = new Date(date);
  } else {
    toParsedDate = date;
  }

  if (isValid(toParsedDate)) {
    const dateToIso = formatDate(toParsedDate);

    const parsedIso = parse(dateToIso, DATE_DISPLAY, today());

    return parsedIso;
  }

  return undefined;
};

// Parse date from string based on DATE_FORMAT
// Default format is DATE_DISPLAY
// Main purpose is to parse date from input with DATE_DISPLAY format
export const parseDatetime = (
  strDate: string,
  datetimeFormat = DATE_DISPLAY,
) => {
  const parsedDate = parse(strDate, datetimeFormat, today());

  return parsedDate;
};

// Check if the date is valid
// dddd/MM/yyyy or dd-MM-yyyy
export const isValidDisplayDate = (strDate: string) => {
  const pattern = /^(0?[1-9]|[12][0-9]|3[01])[/-](0?[1-9]|1[012])[/-]\d{4}$/g;
  return pattern.test(strDate);
};

// Get date list n days before today and n days after today
// Format date to date only without timezone
export const dateSlideItems = (centerDate: Date, dayNums: number) => {
  const dateList = [];
  for (let i = dayNums; i >= 1; i -= 1) {
    const date = new Date(centerDate);
    date.setDate(date.getDate() - i);
    dateList.push(date);
  }
  dateList.push(centerDate);

  for (let i = 1; i <= dayNums; i += 1) {
    const date = new Date(centerDate);
    date.setDate(date.getDate() + i);
    dateList.push(date);
  }

  // format date to date only without timezone
  dateList.forEach((date, index) => {
    dateList[index] = parseDate(date);
  });

  return dateList;
};

// Get day name from date
export const dayname = (date: Date) => {
  const dayName = format(date, 'EEEE', { locale: DATE_LOCALE });
  return dayName;
};

// Get date and month name from date
export const dateMonth = (date: Date) => {
  const dateMonthName = format(date, 'dd MMMM', { locale: DATE_LOCALE });
  return dateMonthName;
};

// Add or subtract date
export const addDate = (date: Date, days: number) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

export const isOperationalHour = (slotHour?: number) => {
  if (!slotHour) return false;

  return slotHour >= 18 && slotHour <= 44;
};

// Generate random past datetime, interval num of days from now
export const randomPastDatetime = (num: number): Date => {
  const now = new Date();
  const past = new Date(now.getTime() - num * 24 * 60 * 60 * 1000);
  return new Date(
    past.getTime() + Math.random() * (now.getTime() - past.getTime()),
  );
};

// generate random future datetime, interval num of days from now
export const randomFutureDatetime = (num: number): Date => {
  const now = new Date();
  const future = new Date(now.getTime() + num * 24 * 60 * 60 * 1000);
  return new Date(
    now.getTime() + Math.random() * (future.getTime() - now.getTime()),
  );
};

export const dateList = (
  date: Date,
  numOfDays: number,
  includeToday = true,
  dateFormat?: string,
): Array<Date | string> => {
  const dateList: Array<Date | string> = [];
  const startDate = new Date(date);

  if (!includeToday && numOfDays < 0) {
    startDate.setDate(startDate.getDate() - 1);
  } else if (!includeToday && numOfDays > 0) {
    startDate.setDate(startDate.getDate() + 1);
  }

  if (numOfDays > 0) {
    for (let i = 0; i < numOfDays; i++) {
      const newDate = new Date(startDate);
      newDate.setDate(startDate.getDate() + i);

      if (dateFormat) {
        dateList.push(format(newDate, dateFormat));
      } else {
        dateList.push(newDate);
      }
    }
  } else {
    for (let i = 0; i > numOfDays; i--) {
      const newDate = new Date(startDate);
      newDate.setDate(startDate.getDate() + i);
      if (dateFormat) {
        dateList.push(format(newDate, dateFormat));
      } else {
        dateList.push(newDate);
      }
    }
  }

  return numOfDays < 0 ? dateList.reverse() : dateList;
};

// generate date list from start date to end date
export const dateRangeList = (startDate: Date, endDate: Date): Date[] => {
  const dates = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

// Generate 1-24 hours
export const hourList = (): number[] => {
  const hourList: number[] = [];
  for (let i = 0; i <= 23; i++) {
    hourList.push(i);
  }
  return hourList;
};

// Generate half hour list
export const halfHourList = (): number[] => {
  const halfHourList: number[] = [];
  for (let i = 0; i <= 47; i++) {
    halfHourList.push(i);
  }
  return halfHourList;
};

export const dayList = () => [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
