
import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/StorageService';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Initialize state function to avoid reading LS on every render
  const [storedValue, setStoredValue] = useState<T>(() => {
    return StorageService.load<T>(key, initialValue);
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      StorageService.save(key, valueToStore);
      
      // Dispatch a custom event so other tabs/components can sync
      window.dispatchEvent(new Event('local-storage'));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}
