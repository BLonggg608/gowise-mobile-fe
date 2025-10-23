import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constant/Colors";
import LoadingModal from "../utils/LoadingModal";
import { SelectList } from "react-native-dropdown-select-list";
import {
  getCityOptions,
  getCountryOptions,
} from "@/utils/CountryCity";
import { Toast } from "toastify-react-native";
import { ToastShowParams } from "toastify-react-native/utils/interfaces";
import Constants from "expo-constants";
import { getSecureData } from "@/utils/storage";
import { decodeToken } from "@/utils/tokenUtils";
import { userInfoType } from "@/app/(tabs)/dashboard";

const UpdateInfo = ({
  visible,
  setVisible,
  setUserInfo,
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  setUserInfo: (userInfo: userInfoType) => void;
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [countryId, setCountryId] = useState("");

  const [countryOptions, setCountryOptions] = useState<
    { key: string; value: string }[]
  >([]);
  const [cityOptions, setCityOptions] = useState<
    { key: string; value: string }[]
  >([]);

  const [pendingToast, setPendingToast] = useState<ToastShowParams | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading && pendingToast) {
      Toast.show(pendingToast);
      setPendingToast(null);
    }
  }, [loading, pendingToast]);

  useEffect(() => {
    // get country
    const fetchCountryOptions = async () => {
      setLoading(true);
      try {
        const countries = await getCountryOptions();
        setCountryOptions(countries);
      } catch (err) {
        console.error("Failed to load country options", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCountryOptions();
  }, []);

  useEffect(() => {
    // get city options based on selected country
    const fetchCityOptions = async () => {
      setCity("");
      if (!countryId) {
        setCityOptions([]);
        return;
      }
      try {
        const cities = await getCityOptions(countryId);
        setCityOptions(cities);
        // console.log(cityOptions);
      } catch (err) {
        console.error("Failed to load city options", err);
        setCityOptions([]);
      }
    };
    fetchCityOptions();
  }, [countryId]);

  const onUpdate = async () => {
    if (!firstName || !lastName || !country || !city) {
      // show error toast
      setPendingToast({
        type: "error",
        text1: "Update Failed",
        text2: "All fields are required",
      });
      return;
    }

    const token = await getSecureData("accessToken");
    const decoded = decodeToken(token ?? "");
    const userId = decoded?.sub;

    // Call API to update user information
    try {
      setLoading(true);
      // await api call here
      const response = await fetch(
        (Constants.expoConfig?.extra?.env.USER_URL as string) + `/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: firstName,
            lastName: lastName,
            region: country,
            city: city,
          }),
        }
      );

      const data = await response.json();

      setLoading(false);

      if (response.ok) {
        setPendingToast({
          type: "success",
          text1: "Update Successful",
          text2: data.message || "Your information has been updated",
        });
        setUserInfo({ firstName, lastName, isPremium: false });
        setVisible(false);
      } else {
        setPendingToast({
          type: "error",
          text1: "Update Failed",
          text2: data.message || "Could not update user information",
        });
      }
    } catch (error) {
      setLoading(false);
      console.error("Error updating user information", error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
            <SafeAreaView style={{ flex: 1 }}>
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
              >
                <Image
                  style={styles.logo}
                  source={require("@/assets/images/gowise_logo.png")}
                />

                <Text style={styles.title}>Update Personal Information</Text>
                <Text style={styles.description}>
                  Please fill in all information to continue
                </Text>

                <View style={styles.loginFormContainer}>
                  {/* First Name */}
                  <Text style={styles.label}>First Name</Text>
                  <View style={styles.input}>
                    <Ionicons
                      style={{ marginVertical: "auto" }}
                      name="person-outline"
                      size={24}
                      color={"#9CA3AF"}
                    />
                    <TextInput
                      style={styles.inputText}
                      placeholder="Enter your first name"
                      placeholderTextColor={"#9CA3AF"}
                      onChangeText={(value) => setFirstName(value)}
                    />
                  </View>

                  {/* Last Name */}
                  <Text style={[styles.label, { marginTop: 16 }]}>
                    Last Name
                  </Text>
                  <View style={styles.input}>
                    <Ionicons
                      style={{ marginVertical: "auto" }}
                      name="person-outline"
                      size={24}
                      color={"#9CA3AF"}
                    />
                    <TextInput
                      style={styles.inputText}
                      placeholder="Enter your last name"
                      placeholderTextColor={"#9CA3AF"}
                      onChangeText={(value) => setLastName(value)}
                    />
                  </View>

                  {/* Country dropdown options */}
                  <Text style={[styles.label, { marginTop: 16 }]}>Country</Text>
                  <SelectList
                    setSelected={(value: string) => {
                      setCountry(value);

                      // get country id from countryOptions
                      const selectedCountry = countryOptions.find(
                        (option) => option.value === value
                      );
                      if (selectedCountry) {
                        setCountryId(selectedCountry.key);
                        console.log(countryId);
                      }
                    }}
                    data={countryOptions}
                    save="value"
                    search={true}
                    fontFamily="inter-regular"
                    maxHeight={200}
                    placeholder="Select your country"
                    searchPlaceholder="Search country"
                    notFoundText="No country found"
                    boxStyles={styles.dropdown}
                    inputStyles={styles.inputText}
                    dropdownStyles={styles.dropdown}
                    dropdownTextStyles={styles.inputText}
                  />

                  {/* City dropdown options */}
                  <Text style={[styles.label, { marginTop: 16 }]}>City</Text>
                  <SelectList
                    key={`city-select-${country}`}
                    // get id of city and city name
                    setSelected={(value: string) => setCity(value)}
                    data={cityOptions}
                    save="value"
                    search={true}
                    fontFamily="inter-regular"
                    maxHeight={200}
                    placeholder="Select your city"
                    searchPlaceholder="Search city"
                    notFoundText="No city found"
                    boxStyles={styles.dropdown}
                    inputStyles={styles.inputText}
                    dropdownStyles={styles.dropdown}
                    dropdownTextStyles={styles.inputText}
                  />

                  {/* Update Button */}
                  <TouchableOpacity style={styles.button} onPress={onUpdate}>
                    <Text
                      style={{
                        fontFamily: "inter-medium",
                        fontSize: 18,
                        color: Colors.WHITE,
                      }}
                    >
                      Update Information
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
            <LoadingModal visible={loading} />
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

export default UpdateInfo;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  //   container: {
  //     width: "80%",
  //     backgroundColor: "white",
  //     borderRadius: 10,
  //     padding: 20,
  //     elevation: 5,
  //   },
  container: {
    // flex: 1,
    // justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    width: "90%",
    height: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  logo: {
    width: "100%",
    height: 80,
    resizeMode: "contain",
    marginTop: "10%",
  },
  title: {
    fontFamily: "inter-bold",
    fontSize: 28,
    textAlign: "center",
    color: Colors.BLACK,
    marginVertical: 8,
  },
  description: {
    fontFamily: "inter-regular",
    fontSize: 15,
    paddingHorizontal: 16,
    textAlign: "center",
    color: Colors.GRAY,
  },
  loginFormContainer: {
    width: "100%",
    marginTop: 30,
    paddingHorizontal: 18,
  },
  label: {
    fontFamily: "inter-medium",
    fontSize: 15,
    color: Colors.BLACK,
  },
  input: {
    // if android padding vertical: 0, ios padding vertical: 10
    paddingVertical: Platform.OS === "android" ? 0 : 10,
    paddingHorizontal: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D7DAE0",
    borderRadius: 8,
    flexDirection: "row",
  },
  inputText: {
    fontFamily: "inter-regular",
    fontSize: 16,
    color: Colors.BLACK,
    marginLeft: 6,
    flex: 1,
  },
  button: {
    backgroundColor: Colors.GREEN,
    padding: 10,
    borderRadius: 10,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdown: {
    // if android padding vertical: 0, ios padding vertical: 10
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D7DAE0",
    borderRadius: 8,
    flexDirection: "row",
  },
});
