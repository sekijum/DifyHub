export interface IStorage {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}

class Storage {
  static getItem<T>(key: string): T | null {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;
      
      try {
        // JSONとして解析を試みる
        return JSON.parse(value) as T;
      } catch (jsonError) {
        // JSON解析に失敗した場合は、値をそのまま返す
        return value as unknown as T;
      }
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage`, error);
      return null;
    }
  }

  static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item ${key} to localStorage`, error);
    }
  }

  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage`, error);
    }
  }

  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  }
}

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.provide('storage', Storage);
});
