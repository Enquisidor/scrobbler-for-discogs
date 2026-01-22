// Stub for expo-secure-store - web uses localStorage instead
// Note: On web, "secure" storage is just localStorage (not truly secure like on mobile)
export const getItemAsync = async (key: string): Promise<string | null> => {
  return localStorage.getItem(key);
};
export const setItemAsync = async (key: string, value: string): Promise<void> => {
  localStorage.setItem(key, value);
};
export const deleteItemAsync = async (key: string): Promise<void> => {
  localStorage.removeItem(key);
};
