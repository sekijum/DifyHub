import { AxiosInstance } from 'axios';
import { IStorage } from '~/plugins/storage';
import dayjs, { type formatDate } from 'dayjs';
import type { IMyProfile } from './user';

declare module '#app' {
  interface NuxtApp {
    payload: {
      user: IMyProfile,
      isLoggedIn: boolean,
      isAdministrator: boolean,
      isDeveloper: boolean,
      isUser: boolean,
    };
    $api: AxiosInstance;
    $storage: IStorage;
    $dayjs: dayjs;
    $formatDate: formatDate;
  }
}
