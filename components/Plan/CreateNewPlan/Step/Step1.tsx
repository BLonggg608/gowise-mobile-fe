import { Colors } from "@/constant/Colors";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Step1 = ({
  isHavePlan,
  setIsHavePlan,
}: {
  isHavePlan: boolean;
  setIsHavePlan: (value: boolean) => void;
}) => {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.contentTitle}>
        Do you already have a travel plan in mind?
      </Text>
      <Text style={styles.contentSubtitle}>
        This will help us customize your planning experience
      </Text>

      <View>
        {/* Options */}
        <TouchableOpacity
          style={[
            styles.optionBox,
            {
              backgroundColor: isHavePlan ? "#ecf8f0ff" : "transparent",
            },
          ]}
          activeOpacity={0.7}
          onPress={() => setIsHavePlan(true)}
        >
          <View
            style={[
              styles.optionButton,
              isHavePlan && {
                borderWidth: 4,
                borderColor: Colors.GREEN,
              },
            ]}
          />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.optionText}>Yes, I have an existing plan</Text>
            <Text style={styles.optionSubtext}>
              I know where I want to go and my details
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionBox,
            {
              backgroundColor: !isHavePlan ? "#effaf2ff" : "transparent",
            },
          ]}
          activeOpacity={0.7}
          onPress={() => setIsHavePlan(false)}
        >
          <View
            style={[
              styles.optionButton,
              !isHavePlan && {
                borderWidth: 4,
                borderColor: Colors.GREEN,
              },
            ]}
          />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.optionText}>
              No, I want to create a new plan
            </Text>
            <Text style={styles.optionSubtext}>
              I know where I want to go and my details
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Step1;

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
