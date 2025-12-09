
import { SystemLog } from '../types';

const APP_PREFIX = 'ISU_CARE_SYS_';
const CURRENT_VERSION = '3.1'; // Bump version
const SECURE_PREFIX = 'SECURE::';

interface StorageMetadata {
  version: string;
  lastBackup: string;
  encrypted: boolean;
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
      METADATA: `${APP_PREFIX}METADATA`,
      REDEMPTIONS: `${APP_PREFIX}REDEMPTIONS`,
      SURPLUS: `${APP_PREFIX}SURPLUS`
    };
  }

  // Simple obfuscation to prevent casual reading of local storage
  // In a real backend scenario, this would be DB encryption.
  private static encode(data: string): string {
    try {
      return SECURE_PREFIX + btoa(unescape(encodeURIComponent(data)));
    } catch (e) {
      console.warn('Encoding failed, falling back to plain text', e);
      return data;
    }
  }

  private static decode(data: string): string {
    if (data.startsWith(SECURE_PREFIX)) {
      try {
        return decodeURIComponent(escape(atob(data.replace(SECURE_PREFIX, ''))));
      } catch (e) {
        console.error('Decoding failed', e);
        return '{}';
      }
    }
    return data; // Return as-is if not encrypted (Backward Compatibility)
  }

  static save<T>(key: string, data: T): boolean {
    try {
      const serialized = JSON.stringify(data);
      // Encrypt sensitive keys (or all keys for simplicity)
      const valueToStore = this.encode(serialized);
      
      localStorage.setItem(key, valueToStore);
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
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;

      // Attempt to decode if it looks encrypted, otherwise parse raw JSON
      const jsonString = raw.startsWith(SECURE_PREFIX) ? this.decode(raw) : raw;
      
      return JSON.parse(jsonString);
    } catch (e) {
      console.error(`Storage Load Error for ${key}:`, e);
      return defaultValue;
    }
  }

  static updateMetadata() {
    const meta: StorageMetadata = {
      version: CURRENT_VERSION,
      lastBackup: new Date().toISOString(),
      encrypted: true
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
      // Decrypt before exporting so the backup JSON is readable/usable
      backup[key] = this.load(key, null);
    });
    
    // Add Metadata
    backup['backup_date'] = new Date().toISOString();
    backup['version'] = CURRENT_VERSION;

    return JSON.stringify(backup, null, 2);
  }

  static async restoreBackup(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      // Basic validation
      if (!data.version && !data[this.getKeys().STUDENTS]) throw new Error('Invalid backup file');

      const keys = this.getKeys();
      
      // Clear current
      Object.values(keys).forEach(key => localStorage.removeItem(key));

      // Restore and Re-encrypt
      Object.values(keys).forEach(key => {
        if (data[key]) {
          this.save(key, data[key]);
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
