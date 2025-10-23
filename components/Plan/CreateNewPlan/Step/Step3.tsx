import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

const Step3 = ({
  isHavePlan,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  numberOfParticipants,
  setNumberOfParticipants,
  budget,
  setBudget,
  destination,
  setDestination,
}: {
  isHavePlan: boolean;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  numberOfParticipants: string;
  setNumberOfParticipants: (value: string) => void;
  budget: string;
  setBudget: (value: string) => void;
  destination: string;
  setDestination: (value: string) => void;
}) => {
  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(
    startDate ? new Date(startDate.split("/").reverse().join("-")) : new Date()
  );
  const [tempEndDate, setTempEndDate] = useState(
    endDate ? new Date(endDate.split("/").reverse().join("-")) : new Date()
  );

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.contentTitle}>Tell us about your travel plans</Text>
      <Text style={styles.contentSubtitle}>
        Provide some basic details to get started
      </Text>

      <View>
        {/* Form Inputs */}
        {/* Destination */}
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

        {/* Start date */}
        <Text style={styles.formLabel}>
          <Ionicons name="calendar-outline" size={15} color={Colors.BLACK} />{" "}
          Start Date
        </Text>
        <TouchableOpacity
          style={styles.inputField}
          onPress={() => {
            setOpenStartDate(!openStartDate);
          }}
        >
          <Text style={startDate ? styles.dateText : styles.datePlaceholder}>
            {startDate ? startDate : "Select start date"}
          </Text>
        </TouchableOpacity>
        {openStartDate && (
          <DateTimePicker
            value={tempStartDate}
            mode="date"
            display="spinner"
            minimumDate={new Date()}
            themeVariant="light"
            onChange={(event, selectedDate) => {
              setOpenStartDate(false);
              if (event.type === "set" && selectedDate) {
                setTempStartDate(selectedDate);
                setStartDate(
                  selectedDate
                    .toISOString()
                    .split("T")[0]
                    .split("-")
                    .reverse()
                    .join("/")
                );
              }
            }}
            style={{
              backgroundColor: Colors.GRAY + "10",
              borderRadius: 8,
              marginBottom: 12,
            }}
          />
        )}

        {/* End date */}
        <Text style={styles.formLabel}>
          <Ionicons name="calendar-outline" size={15} color={Colors.BLACK} />{" "}
          End Date
        </Text>
        <TouchableOpacity
          style={styles.inputField}
          onPress={() => {
            setOpenEndDate(!openEndDate);
          }}
        >
          <Text style={endDate ? styles.dateText : styles.datePlaceholder}>
            {endDate ? endDate : "Select end date"}
          </Text>
        </TouchableOpacity>
        {openEndDate && (
          <DateTimePicker
            value={tempEndDate}
            mode="date"
            display="spinner"
            minimumDate={new Date()}
            themeVariant="light"
            onChange={(event, selectedDate) => {
              setOpenEndDate(false);
              if (event.type === "set" && selectedDate) {
                setTempEndDate(selectedDate);
                setEndDate(
                  selectedDate
                    .toISOString()
                    .split("T")[0]
                    .split("-")
                    .reverse()
                    .join("/")
                );
              }
            }}
            style={{
              backgroundColor: Colors.GRAY + "10",
              borderRadius: 8,
              marginBottom: 12,
            }}
          />
        )}

        {/* Number of participants */}
        <Text style={styles.formLabel}>
          <Ionicons name="person-outline" size={15} color={Colors.BLACK} />{" "}
          Number of Participants
        </Text>
        <TextInput
          value={numberOfParticipants.toString()}
          onChangeText={(text) => setNumberOfParticipants(text)}
          placeholder="Enter number of participants"
          keyboardType="numeric"
          style={styles.inputField}
        />

        {/* Budget */}
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
  dateText: {
    fontSize: 15,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
  },
  datePlaceholder: {
    fontSize: 15,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
});
