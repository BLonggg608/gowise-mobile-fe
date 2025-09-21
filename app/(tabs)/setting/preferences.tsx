import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const statusBarHeight = Constants.statusBarHeight;

// Initial preferences data (should be fetched from API in real app)
const initialPreferences = {
  language: "English",
  timezone: "GMT+7",
  theme: "auto", // 'light' | 'dark' | 'auto'
};

const languageOptions = ["English", "Vietnamese", "Japanese", "French"];
const timezoneOptions = ["GMT+7", "GMT+8", "GMT+9", "UTC", "GMT+1"];

const themeOptions = [
  { key: "light", label: "Light", icon: "sunny-outline" },
  { key: "dark", label: "Dark", icon: "moon-outline" },
  { key: "auto", label: "Auto", icon: "phone-portrait-outline" },
];

const Preferences = () => {
  // State for preferences data
  const [prefs, setPrefs] = useState(initialPreferences);
  // State for dropdowns
  const [showLang, setShowLang] = useState(false);
  const [showTz, setShowTz] = useState(false);
  // State for dropdown position
  const [langDropdownPos, setLangDropdownPos] = useState<{
    x: number;
    y: number;
    w: number;
  } | null>(null);
  const [tzDropdownPos, setTzDropdownPos] = useState<{
    x: number;
    y: number;
    w: number;
  } | null>(null);
  // Refs for measuring position
  const langRef = React.useRef<View>(null);
  const tzRef = React.useRef<View>(null);

  // Handle input changes for each field
  const handleChange = (field: keyof typeof prefs, value: string) => {
    setPrefs((prev) => ({ ...prev, [field]: value }));
    // TODO: Call API to update preferences with 'prefs' state
    if (field === "language") setShowLang(false);
    if (field === "timezone") setShowTz(false);
  };

  // Show dropdown and measure position
  const openLangDropdown = () => {
    if (langRef.current) {
      langRef.current.measureInWindow(
        (x: number, y: number, w: number, h: number) => {
          setLangDropdownPos({ x, y: y + h, w });
          setShowLang(true);
        }
      );
    } else {
      setShowLang(true);
    }
  };
  const openTzDropdown = () => {
    if (tzRef.current) {
      tzRef.current.measureInWindow(
        (x: number, y: number, w: number, h: number) => {
          setTzDropdownPos({ x, y: y + h, w });
          setShowTz(true);
        }
      );
    } else {
      setShowTz(true);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header row with title */}
      <View style={styles.header}>
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
            <TouchableOpacity
              ref={langRef}
              style={[
                styles.dropdown,
                { borderColor: showLang ? Colors.GREEN : "#eee" },
              ]}
              activeOpacity={0.8}
              onPress={openLangDropdown}
            >
              <Text
                style={{
                  color: Colors.BLACK,
                  fontSize: 15,
                  fontFamily: "inter-medium",
                }}
              >
                {prefs.language}
              </Text>
              <Ionicons
                name={showLang ? "chevron-up-outline" : "chevron-down-outline"}
                size={20}
                color={Colors.GRAY}
              />
            </TouchableOpacity>
            {/* Dropdown as Modal overlay */}
            {showLang && langDropdownPos && (
              <Modal
                visible={showLang}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLang(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowLang(false)}
                >
                  <View
                    style={[
                      styles.dropdownList,
                      {
                        position: "absolute",
                        left: langDropdownPos.x,
                        top: langDropdownPos.y,
                        width: langDropdownPos.w,
                        zIndex: 100,
                      },
                    ]}
                  >
                    {languageOptions.map((lang) => (
                      <TouchableOpacity
                        key={lang}
                        style={[
                          styles.dropdownItem,
                          prefs.language === lang && styles.dropdownItemActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => handleChange("language", lang)}
                      >
                        <Text
                          style={{
                            color:
                              prefs.language === lang
                                ? Colors.GREEN
                                : Colors.BLACK,
                            fontSize: 15,
                            fontFamily: "inter-medium",
                          }}
                        >
                          {lang}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>
            )}
          </View>
          {/* Time Zone Dropdown */}
          <View style={styles.inputColFull}>
            <Text style={styles.label}>Time Zone</Text>
            <TouchableOpacity
              ref={tzRef}
              style={[
                styles.dropdown,
                { borderColor: showTz ? Colors.GREEN : "#eee" },
              ]}
              activeOpacity={0.8}
              onPress={openTzDropdown}
            >
              <Text
                style={{
                  color: Colors.BLACK,
                  fontSize: 15,
                  fontFamily: "inter-medium",
                }}
              >
                {prefs.timezone}
              </Text>
              <Ionicons
                name={showTz ? "chevron-up-outline" : "chevron-down-outline"}
                size={20}
                color={Colors.GRAY}
              />
            </TouchableOpacity>
            {/* Dropdown as Modal overlay */}
            {showTz && tzDropdownPos && (
              <Modal
                visible={showTz}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTz(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowTz(false)}
                >
                  <View
                    style={[
                      styles.dropdownList,
                      {
                        position: "absolute",
                        left: tzDropdownPos.x,
                        top: tzDropdownPos.y,
                        width: tzDropdownPos.w,
                        zIndex: 100,
                      },
                    ]}
                  >
                    {timezoneOptions.map((tz) => (
                      <TouchableOpacity
                        key={tz}
                        style={[
                          styles.dropdownItem,
                          prefs.timezone === tz && styles.dropdownItemActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => handleChange("timezone", tz)}
                      >
                        <Text
                          style={{
                            color:
                              prefs.timezone === tz
                                ? Colors.GREEN
                                : Colors.BLACK,
                            fontSize: 15,
                            fontFamily: "inter-medium",
                          }}
                        >
                          {tz}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>
            )}
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
                  {opt.label}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: statusBarHeight + 12,
    paddingBottom: 16,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cardTitle: {
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
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownItemActive: {
    backgroundColor: "#9c9c9c1e",
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
