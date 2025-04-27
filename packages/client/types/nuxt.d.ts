import { AxiosInstance } from 'axios';
import { IStorage } from '~/plugins/storage';
import dayjs, { type formatDate } from 'dayjs';
import type {IUser} from './user';

interface INuxtApp {
  payload: {
    user?: IUser,
    isLoggedIn: boolean,
    isAdmin: boolean,
    isMember: boolean,
  };
  $api: AxiosInstance;
  $storage: IStorage;
  $dayjs: dayjs;
  $formatDate: formatDate;
}

declare module '#app' {
  interface NuxtApp extends INuxtApp
}

declare module 'vue' {
  interface ComponentCustomProperties extends INuxtApp
}
