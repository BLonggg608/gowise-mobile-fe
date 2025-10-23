import { Colors } from "@/constant/Colors";
import { getCityOptions, getCountryOptions } from "@/utils/CountryCity";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { Toast } from "toastify-react-native";
import { ToastShowParams } from "toastify-react-native/utils/interfaces";

const statusBarHeight = Constants.statusBarHeight;

// Initial preferences data (should be fetched from API in real app)
const initialPreferences = {
  language: "English",
  country: "",
  city: "",
  theme: "auto", // 'light' | 'dark' | 'auto'
};

const languageOptions = [
  { key: "1", value: "English" },
  { key: "2", value: "Vietnamese" },
];

const themeOptions = [
  { key: "light", value: "Light", icon: "sunny-outline" },
  { key: "dark", value: "Dark", icon: "moon-outline" },
  { key: "auto", value: "Auto", icon: "phone-portrait-outline" },
];

const Preferences = () => {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  // State for preferences data
  const [prefs, setPrefs] = useState(initialPreferences);
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
    const fetchUserId = async () => {
      const id = await getUserIdFromToken();
      setUserId(id);
    };
    fetchUserId();
  }, []);

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
      setPrefs((prev) => ({ ...prev, city: "" }));
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

  const handleUpdate = async ({
    key,
    value,
  }: {
    key: string;
    value: string;
  }) => {
    // TODO: Call API to update profile with 'profile' state
    if (!userId) return;
    console.log(userId);

    try {
      const response = await fetch(
        Constants.expoConfig?.extra?.env.USER_URL + `/${userId}/${key}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            [key]: value,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Update success");
      } else {
        console.error("Failed to update profile:", data.message);
      }
    } catch {
      console.error("Failed to update profile");
    }
  };

  const handleChange = (field: string, value: string) => {
    setPrefs((prev) => ({ ...prev, [field]: value }));
    // Here you would also save to backend or local storage
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header row with title */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackBtn}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.BLACK} />
        </TouchableOpacity>
        <Text style={styles.cardTitle}>Preferences</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* General Preferences Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>General Preferences</Text>
          {/* Language Dropdown */}
          <View style={styles.inputColFull}>
            <Text style={styles.label}>Language</Text>
            <SelectList
              setSelected={(value: string) => handleChange("language", value)}
              data={languageOptions}
              save="value"
              search={false}
              boxStyles={styles.dropdown}
              inputStyles={{ fontFamily: "inter-medium", color: Colors.BLACK }}
              dropdownStyles={styles.dropdownList}
              dropdownTextStyles={{
                fontFamily: "inter-medium",
                color: Colors.BLACK,
              }}
              defaultOption={languageOptions.find(
                (opt) => opt.value === prefs.language
              )}
            />
          </View>
          {/* Country Dropdown */}
          <View style={styles.inputColFull}>
            <Text style={styles.label}>Country</Text>
            <SelectList
              setSelected={(value: string) => {
                handleChange("country", value);
                const selectedCountry = countryOptions.find(
                  (opt) => opt.value === value
                );
                setCountryId(selectedCountry ? selectedCountry.key : "");
                handleUpdate({ key: "region", value: value });
              }}
              data={countryOptions}
              save="value"
              search={true}
              boxStyles={styles.dropdown}
              inputStyles={{ fontFamily: "inter-medium", color: Colors.BLACK }}
              dropdownStyles={styles.dropdownList}
              dropdownTextStyles={{
                fontFamily: "inter-medium",
                color: Colors.BLACK,
              }}
              placeholder="Select your country"
              // defaultOption={countryOptions.find(
              //   (opt) => opt.value === prefs.country
              // )}
            />
          </View>

          {/* City Dropdown */}
          <View style={styles.inputColFull}>
            <Text style={styles.label}>City</Text>
            <SelectList
              setSelected={(value: string) => {
                handleChange("city", value);
                handleUpdate({ key: "city", value: value });
              }}
              data={cityOptions}
              save="value"
              search={true}
              boxStyles={styles.dropdown}
              inputStyles={{ fontFamily: "inter-medium", color: Colors.BLACK }}
              dropdownStyles={styles.dropdownList}
              dropdownTextStyles={{
                fontFamily: "inter-medium",
                color: Colors.BLACK,
              }}
              placeholder="Select your city"
              // defaultOption={countryOptions.find(
              //   (opt) => opt.value === prefs.country
              // )}
            />
          </View>
        </View>

        {/* Theme & Display Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Theme & Display</Text>
          <Text style={styles.label}>Theme</Text>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.themeOption,
                  prefs.theme === opt.key && styles.themeOptionActive,
                ]}
                activeOpacity={0.8}
                onPress={() => handleChange("theme", opt.key)}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={28}
                  color={prefs.theme === opt.key ? Colors.GREEN : Colors.GRAY}
                  style={{ marginBottom: 8 }}
                />
                <Text
                  style={{
                    color:
                      prefs.theme === opt.key ? Colors.GREEN : Colors.BLACK,
                    fontSize: 15,
                    fontFamily: "inter-medium",
                  }}
                >
                  {opt.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Preferences;

// Styles for preferences screen, responsive and consistent with app theme
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 18,
  },
  header: {
    flexDirection: "row",
    // alignItems: "center",
    // justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: statusBarHeight + 12,
    paddingBottom: 16,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#9c9c9c1e",
  },
  cardTitle: {
    marginLeft: 12,
    fontSize: 22,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafb",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#eee",
    marginTop: 8,
  },
  dropdownList: {
    backgroundColor: "#f8fafb", // super light gray
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
  },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginBottom: 12,
  },
  inputColFull: {
    width: "100%",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginBottom: 4,
  },
  themeRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  themeOption: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "#eee",
  },
  themeOptionActive: {
    borderColor: Colors.GREEN,
    backgroundColor: "#eafcf7",
  },
});
