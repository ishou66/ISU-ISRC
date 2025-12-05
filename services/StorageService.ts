
import { SystemLog } from '../types';

const APP_PREFIX = 'ISU_CARE_SYS_';
const CURRENT_VERSION = '3.0';

interface StorageMetadata {
  version: string;
  lastBackup: string;
}

export class StorageService {
  static getKeys() {
    return {
      STUDENTS: `${APP_PREFIX}STUDENTS`,
      CONFIGS: `${APP_PREFIX}CONFIGS`,
      SCHOLARSHIPS: `${APP_PREFIX}SCHOLARSHIPS`,
      SCHOLARSHIP_CONFIGS: `${APP_PREFIX}SCHOLARSHIP_CONFIGS`,
      ACTIVITIES: `${APP_PREFIX}ACTIVITIES`,
      EVENTS: `${APP_PREFIX}EVENTS`,
      LOGS: `${APP_PREFIX}LOGS`,
      SYSTEM_LOGS: `${APP_PREFIX}SYSTEM_LOGS`,
      USERS: `${APP_PREFIX}USERS`,
      ROLES: `${APP_PREFIX}ROLES`,
      METADATA: `${APP_PREFIX}METADATA`
    };
  }

  static save<T>(key: string, data: T): boolean {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      this.updateMetadata();
      return true;
    } catch (e) {
      console.error('Storage Save Error:', e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert('系統儲存空間已滿！請備份資料後執行清理。');
      }
      return false;
    }
  }

  static load<T>(key: string, defaultValue: T): T {
    try {
      const serialized = localStorage.getItem(key);
      if (!serialized) return defaultValue;
      return JSON.parse(serialized);
    } catch (e) {
      console.error('Storage Load Error:', e);
      return defaultValue;
    }
  }

  static updateMetadata() {
    const meta: StorageMetadata = {
      version: CURRENT_VERSION,
      lastBackup: new Date().toISOString()
    };
    localStorage.setItem(this.getKeys().METADATA, JSON.stringify(meta));
  }

  static getSizeInKB(): number {
    let total = 0;
    for (const x in localStorage) {
      if (!localStorage.hasOwnProperty(x)) continue;
      total += ((localStorage[x].length + x.length) * 2);
    }
    return Number((total / 1024).toFixed(2));
  }

  static createBackup(): string {
    const backup: Record<string, any> = {};
    const keys = this.getKeys();
    Object.values(keys).forEach(key => {
      const raw = localStorage.getItem(key);
      if (raw) backup[key] = JSON.parse(raw);
    });
    
    // Add Metadata
    backup['backup_date'] = new Date().toISOString();
    backup['version'] = CURRENT_VERSION;

    return JSON.stringify(backup, null, 2);
  }

  static async restoreBackup(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (!data.version) throw new Error('Invalid backup file');

      const keys = this.getKeys();
      
      // Clear current
      Object.values(keys).forEach(key => localStorage.removeItem(key));

      // Restore
      Object.values(keys).forEach(key => {
        if (data[key]) {
          localStorage.setItem(key, JSON.stringify(data[key]));
        }
      });

      return true;
    } catch (e) {
      console.error('Restore Error:', e);
      alert('備份檔案格式錯誤或損毀，還原失敗。');
      return false;
    }
  }

  static clearAll() {
    const keys = this.getKeys();
    Object.values(keys).forEach(key => localStorage.removeItem(key));
  }
}
