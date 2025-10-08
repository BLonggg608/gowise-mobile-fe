import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";

const statusBarHeight = Constants.statusBarHeight;

// Initial preferences data (should be fetched from API in real app)
const initialPreferences = {
  language: "English",
  timezone: "GMT+7",
  theme: "auto", // 'light' | 'dark' | 'auto'
};

const languageOptions = [
  { key: "1", value: "English" },
  { key: "2", value: "Vietnamese" },
];
const timezoneOptions = [
  { key: "1", value: "GMT+7" },
  { key: "2", value: "GMT+8" },
  { key: "3", value: "GMT+9" },
];

const themeOptions = [
  { key: "light", value: "Light", icon: "sunny-outline" },
  { key: "dark", value: "Dark", icon: "moon-outline" },
  { key: "auto", value: "Auto", icon: "phone-portrait-outline" },
];

const Preferences = () => {
  const router = useRouter();
  // State for preferences data
  const [prefs, setPrefs] = useState(initialPreferences);

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
          {/* Time Zone Dropdown */}
          <View style={styles.inputColFull}>
            <Text style={styles.label}>Time Zone</Text>
            <SelectList
              setSelected={(value: string) => handleChange("timezone", value)}
              data={timezoneOptions}
              save="value"
              search={false}
              boxStyles={styles.dropdown}
              inputStyles={{ fontFamily: "inter-medium", color: Colors.BLACK }}
              dropdownStyles={styles.dropdownList}
              dropdownTextStyles={{
                fontFamily: "inter-medium",
                color: Colors.BLACK,
              }}
              defaultOption={timezoneOptions.find(
                (opt) => opt.value === prefs.timezone
              )}
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
