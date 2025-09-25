import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

const Step3 = ({
  isHavePlan,
  numberOfDays,
  setNumberOfDays,
  budget,
  setBudget,
  destination,
  setDestination,
}: {
  isHavePlan: boolean;
  numberOfDays: string;
  setNumberOfDays: (value: string) => void;
  budget: string;
  setBudget: (value: string) => void;
  destination: string;
  setDestination: (value: string) => void;
}) => {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.contentTitle}>Tell us about your travel plans</Text>
      <Text style={styles.contentSubtitle}>
        Provide some basic details to get started
      </Text>

      <View>
        {/* Form Inputs */}
        <Text style={styles.formLabel}>
          <Ionicons name="calendar-outline" size={15} color={Colors.BLACK} />{" "}
          Number of Days
        </Text>
        <TextInput
          value={numberOfDays.toString()}
          onChangeText={(text) => setNumberOfDays(text)}
          keyboardType="numeric"
          placeholder="Enter number of days"
          style={styles.inputField}
        />
        <Text style={styles.formLabel}>
          <Ionicons name="wallet-outline" size={15} color={Colors.BLACK} />{" "}
          Budget
        </Text>
        <TextInput
          value={budget.toString()}
          onChangeText={(text) => setBudget(text)}
          placeholder="Enter your budget"
          keyboardType="numeric"
          style={styles.inputField}
        />
        {isHavePlan && (
          <View>
            <Text style={styles.formLabel}>
              <Ionicons
                name="location-outline"
                size={15}
                color={Colors.BLACK}
              />{" "}
              Destination
            </Text>
            <TextInput
              value={destination}
              onChangeText={(text) => setDestination(text)}
              placeholder="Where do you want to go?"
              placeholderTextColor={Colors.GRAY}
              style={styles.inputField}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default Step3;

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
  formLabel: {
    fontSize: 15,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginBottom: 8,
  },
  inputField: {
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    fontSize: 15,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
  },
});
