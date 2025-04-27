import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/ja';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ja');

const DEFAULT_TIMEZONE = 'Asia/Tokyo';
const DEFAULT_FORMAT = 'YYYY年MM月DD日(dd) HH時mm分';

export const formatDate = (date: Date | string, { timezone = DEFAULT_TIMEZONE, format = DEFAULT_FORMAT } = {}) => {
  if (!date || !dayjs(date).isValid()) {
    throw new Error('Invalid date provided');
  }
  return dayjs(date).tz(timezone).format(format);
};

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.provide('dayjs', dayjs);
  nuxtApp.provide('formatDate', formatDate);
});
