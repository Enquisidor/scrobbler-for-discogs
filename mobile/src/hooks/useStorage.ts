import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface StorageOptions {
  /** Use secure storage (expo-secure-store) for sensitive data like credentials */
  secure?: boolean;
}

/**
 * Mobile equivalent of useLocalStorage with support for both
 * regular storage (AsyncStorage) and secure storage (expo-secure-store).
 *
 * @param key - Storage key
 * @param initialValue - Default value if nothing stored
 * @param options - Storage options including secure flag
 * @returns [value, setValue, { isLoading, removeValue }]
 */
export function useStorage<T>(key: string, initialValue: T, options: StorageOptions = {}) {
  const { secure = false } = options;
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Storage adapter based on secure flag
  const storage = {
    getItem: secure ? SecureStore.getItemAsync : AsyncStorage.getItem,
    setItem: secure ? SecureStore.setItemAsync : AsyncStorage.setItem,
    removeItem: secure ? SecureStore.deleteItemAsync : AsyncStorage.removeItem,
  };

  // Load from storage on mount
  useEffect(() => {
    let isMounted = true;

    const loadValue = async () => {
      try {
        const item = await storage.getItem(key);
        if (isMounted && item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error(`Error loading ${key} from ${secure ? 'SecureStore' : 'AsyncStorage'}:`, error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadValue();

    return () => {
      isMounted = false;
    };
  }, [key, secure]);

  // Save to storage
  const setValue = useCallback(
    async (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        await storage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error saving ${key} to ${secure ? 'SecureStore' : 'AsyncStorage'}:`, error);
        throw error; // Re-throw for caller to handle
      }
    },
    [key, storedValue, secure]
  );

  // Delete from storage
  const removeValue = useCallback(async () => {
    try {
      setStoredValue(initialValue);
      await storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from ${secure ? 'SecureStore' : 'AsyncStorage'}:`, error);
      throw error;
    }
  }, [key, initialValue, secure]);

  return [storedValue, setValue, { isLoading, removeValue }] as const;
}
