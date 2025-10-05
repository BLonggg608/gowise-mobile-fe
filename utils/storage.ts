import * as SecureStore from "expo-secure-store";

// save data to secure storage
export const saveSecureData = async ({
  key,
  value,
}: {
  key: string;
  value: string;
}) => {
  await SecureStore.setItemAsync(key, value);
};

// get data from secure storage
export const getSecureData = async (key: string) => {
  return await SecureStore.getItemAsync(key);
};

// delete data from secure storage
export const deleteSecureData = async (key: string) => {
  await SecureStore.deleteItemAsync(key);
};
