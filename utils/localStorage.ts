import AsyncStorage from "@react-native-async-storage/async-storage";

// save data to local storage
export const saveData = async ({key, value}: {key: string, value: any}) => {
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  await AsyncStorage.setItem(key, stringValue);
};

// get data from local storage
export const getData = async (key: string) => {
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value) : null;
};

// delete data from local storage
export const deleteData = async (key: string) => {
  await AsyncStorage.removeItem(key);
};
