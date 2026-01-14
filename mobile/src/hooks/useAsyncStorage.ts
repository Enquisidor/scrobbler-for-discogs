import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Mobile equivalent of useLocalStorage, using AsyncStorage
 * for non-sensitive data like settings and cache.
 *
 * @param key - Storage key
 * @param initialValue - Default value if nothing stored
 * @returns [value, setValue, { isLoading, removeValue }]
 */
export function useAsyncStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load from async storage on mount
  useEffect(() => {
    let isMounted = true;

    const loadValue = async () => {
      try {
        const item = await AsyncStorage.getItem(key);
        if (isMounted && item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error(`Error loading ${key} from AsyncStorage:`, error);
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
  }, [key]);

  // Save to async storage
  const setValue = useCallback(
    async (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error saving ${key} to AsyncStorage:`, error);
        throw error; // Re-throw for caller to handle
      }
    },
    [key, storedValue]
  );

  // Delete from async storage
  const removeValue = useCallback(async () => {
    try {
      setStoredValue(initialValue);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from AsyncStorage:`, error);
      throw error;
    }
  }, [key, initialValue]);

  return [storedValue, setValue, { isLoading, removeValue }] as const;
}
