import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

/**
 * Mobile equivalent of useLocalStorage, using expo-secure-store
 * for sensitive data like API credentials.
 *
 * @param key - Storage key
 * @param initialValue - Default value if nothing stored
 * @returns [value, setValue, { isLoading, removeValue }]
 */
export function useSecureStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load from secure storage on mount
  useEffect(() => {
    let isMounted = true;

    const loadValue = async () => {
      try {
        const item = await SecureStore.getItemAsync(key);
        if (isMounted && item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error(`Error loading ${key} from SecureStore:`, error);
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

  // Save to secure storage
  const setValue = useCallback(
    async (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        await SecureStore.setItemAsync(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error saving ${key} to SecureStore:`, error);
        throw error; // Re-throw for caller to handle
      }
    },
    [key, storedValue]
  );

  // Delete from secure storage
  const removeValue = useCallback(async () => {
    try {
      setStoredValue(initialValue);
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing ${key} from SecureStore:`, error);
      throw error;
    }
  }, [key, initialValue]);

  return [storedValue, setValue, { isLoading, removeValue }] as const;
}
