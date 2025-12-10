
import { SystemLog } from '../types';
import CryptoJS from 'crypto-js';

const APP_PREFIX = 'ISU_CARE_SYS_';
const CURRENT_VERSION = '3.5'; // Bump version for Performance Update
const LEGACY_PREFIX = 'SECURE::'; // Old Base64 prefix
const AES_PREFIX = 'AES::'; // New Encryption prefix
const SECRET_KEY = 'ISU_CS_2024_SECURE_KEY_!@#_PROTECTED'; // In a real app, this should be env var or derived from user

interface StorageMetadata {
  version: string;
  lastBackup: string;
  encrypted: boolean;
  algorithm: string;
}

interface SignedBackup {
  payload: string; // JSON string of { data, meta }
  signature: string; // HMAC-SHA256
}

export class StorageService {
  // In-Memory Cache to prevent O(n) parsing overhead on every read
  private static cache: Map<string, any> = new Map();
  // Secondary Indices for O(1) lookups by ID
  private static indices: Map<string, Map<string, any>> = new Map();

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
      SURPLUS: `${APP_PREFIX}SURPLUS`,
      ANNOUNCEMENTS: `${APP_PREFIX}ANNOUNCEMENTS`
    };
  }

  // Use AES Encryption instead of Base64 obfuscation
  private static encode(data: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
      return AES_PREFIX + encrypted;
    } catch (e) {
      console.warn('Encryption failed, falling back to plain text', e);
      return data;
    }
  }

  // Handle both AES (new) and Base64 (legacy migration)
  private static decode(data: string): string {
    // 1. New AES Encryption
    if (data.startsWith(AES_PREFIX)) {
      try {
        const bytes = CryptoJS.AES.decrypt(data.replace(AES_PREFIX, ''), SECRET_KEY);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedData) return 'null'; // Return null string on empty decrypt
        return decryptedData;
      } catch (e) {
        console.error('AES Decryption failed', e);
        return 'null';
      }
    }
    
    // 2. Legacy Base64 (Migration Support)
    if (data.startsWith(LEGACY_PREFIX)) {
      try {
        return decodeURIComponent(escape(atob(data.replace(LEGACY_PREFIX, ''))));
      } catch (e) {
        console.error('Legacy Decoding failed', e);
        return 'null';
      }
    }
    
    return data; // Return as-is if plain text
  }

  static save<T>(key: string, data: T): boolean {
    try {
      // 1. Update In-Memory Cache & Index
      this.cache.set(key, data);
      if (Array.isArray(data)) {
          const index = new Map();
          data.forEach((item: any) => {
              if (item && item.id) index.set(item.id, item);
          });
          this.indices.set(key, index);
      }

      // 2. Persist to Disk
      const serialized = JSON.stringify(data);
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
    // 1. Check Memory Cache (Fast Path)
    if (this.cache.has(key)) {
        return this.cache.get(key) as T;
    }

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
          // Cache default value
          this.cache.set(key, defaultValue);
          return defaultValue;
      }

      // Attempt to decode (AES or Legacy)
      const jsonString = this.decode(raw);
      
      if (jsonString === 'null' || !jsonString) return defaultValue;

      const parsed = JSON.parse(jsonString);

      // Runtime Type Safety Check (Basic)
      if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
          console.warn(`Type mismatch for key ${key}. Expected Array, got ${typeof parsed}. Returning default.`);
          return defaultValue;
      }
      
      // 2. Populate Memory Cache & Index
      this.cache.set(key, parsed);
      if (Array.isArray(parsed)) {
          const index = new Map();
          parsed.forEach((item: any) => {
              if (item && item.id) index.set(item.id, item);
          });
          this.indices.set(key, index);
      }
      
      return parsed;
    } catch (e) {
      console.error(`Storage Load Error for ${key}:`, e);
      return defaultValue;
    }
  }

  // New O(1) Lookup Method for P1 Performance Requirement
  static getItemById<T>(key: string, id: string): T | undefined {
      // Ensure data is loaded into cache/index
      if (!this.cache.has(key)) {
          this.load(key, []);
      }
      return this.indices.get(key)?.get(id) as T | undefined;
  }

  static updateMetadata() {
    const meta: StorageMetadata = {
      version: CURRENT_VERSION,
      lastBackup: new Date().toISOString(),
      encrypted: true,
      algorithm: 'AES-256'
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

  /**
   * Creates a signed backup file to ensure data integrity.
   */
  static createBackup(): string {
    const dataMap: Record<string, any> = {};
    const keys = this.getKeys();
    
    // 1. Collect decrypted data (use load to ensure cache is hot/synced)
    Object.values(keys).forEach(key => {
      dataMap[key] = this.load(key, null);
    });
    
    // 2. Create Payload with Metadata
    const contentObj = {
      data: dataMap,
      meta: {
        version: CURRENT_VERSION,
        timestamp: new Date().toISOString(),
        system: 'ISU_CARE_SYS'
      }
    };
    
    // 3. Serialize & Sign
    const payloadString = JSON.stringify(contentObj);
    const signature = CryptoJS.HmacSHA256(payloadString, SECRET_KEY).toString();

    const signedBackup: SignedBackup = {
      payload: payloadString,
      signature: signature
    };

    return JSON.stringify(signedBackup, null, 2);
  }

  /**
   * Restores data from a backup file with integrity verification.
   */
  static async restoreBackup(jsonString: string): Promise<boolean> {
    try {
      let parsed: SignedBackup;
      try {
        parsed = JSON.parse(jsonString);
      } catch {
        throw new Error('檔案格式錯誤 (Invalid JSON)');
      }

      // 1. Verify Structure and Signature
      if (!parsed.payload || !parsed.signature) {
         throw new Error('備份檔案無效或缺少數位簽章 (Signature Missing)');
      }

      // 2. Verify Integrity (HMAC check)
      const calculatedSig = CryptoJS.HmacSHA256(parsed.payload, SECRET_KEY).toString();
      if (calculatedSig !== parsed.signature) {
        throw new Error('安全性警告：備份檔案簽章不符，資料可能已被竄改！(Integrity Check Failed)');
      }

      // 3. Parse Content
      const content = JSON.parse(parsed.payload);
      const data = content.data;
      
      if (!data) throw new Error('備份檔案內容為空');

      const keys = this.getKeys();
      
      // 4. Clear & Restore
      this.clearAll(); // Important: Clears Cache too
      
      Object.values(keys).forEach(key => localStorage.removeItem(key));

      Object.values(keys).forEach(key => {
        if (data[key]) {
          this.save(key, data[key]);
        }
      });

      return true;
    } catch (e: any) {
      console.error('Restore Error:', e);
      alert(`還原失敗: ${e.message}`);
      return false;
    }
  }

  static clearAll() {
    this.cache.clear();
    this.indices.clear();
    const keys = this.getKeys();
    Object.values(keys).forEach(key => localStorage.removeItem(key));
  }
}