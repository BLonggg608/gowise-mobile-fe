import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Step2 = ({
  type,
  setType,
}: {
  type: "domestic" | "international";
  setType: (value: "domestic" | "international") => void;
}) => {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.contentTitle}>
        What type of travel are you interested in?
      </Text>
      <Text style={styles.contentSubtitle}>
        This help us suggest the best destinations for you
      </Text>

      <View>
        {/* Options */}
        <TouchableOpacity
          style={[
            styles.optionBox,
            {
              backgroundColor:
                type === "domestic" ? "#ecf8f0ff" : "transparent",
            },
          ]}
          activeOpacity={0.7}
          onPress={() => setType("domestic")}
        >
          <Ionicons
            name="home-outline"
            size={18}
            color={"#2563EB"}
            style={{ padding: 6, borderRadius: 50, backgroundColor: "#DBEAFE" }}
          />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.optionText}>Domestic Travel</Text>
            <Text style={styles.optionSubtext}>
              Explore destinations within your country
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionBox,
            {
              backgroundColor:
                type === "international" ? "#effaf2ff" : "transparent",
            },
          ]}
          activeOpacity={0.7}
          onPress={() => setType("international")}
        >
          <Ionicons
            name="globe-outline"
            size={18}
            color={"#9333EA"}
            style={{ padding: 6, borderRadius: 50, backgroundColor: "#F3E8FF" }}
          />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.optionText}>International Travel</Text>
            <Text style={styles.optionSubtext}>
              Discover amazing destinations worldwide
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Step2;

const styles = StyleSheet.create({
  contentTitle: {
    fontSize: 18,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    textAlign: "center",
    marginBottom: 6,
  },
  contentSubtitle: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "center",
    marginBottom: 20,
  },
  optionBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  optionButton: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 50,
  },
  optionText: {
    fontSize: 15,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  optionSubtext: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
});
