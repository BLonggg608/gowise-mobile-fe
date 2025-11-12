import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { ProgressStep, ProgressSteps } from "react-native-progress-steps";
import Step1 from "./Step/Step1";
import Step2 from "./Step/Step2";
import Step3 from "./Step/Step3";
import Step4 from "./Step/Step4";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import LoadingModal from "@/components/utils/LoadingModal";
import * as Location from "expo-location";

interface CreateNewPlanModelProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: string;
    startDate: string;
    endDate: string;
    NumberOfDays: string;
    NumberOfParticipants: string;
    Budget: string;
    Destination: string;
  }) => void;
}

const CreateNewPlanModel: React.FC<CreateNewPlanModelProps> = ({
  visible,
  onClose,
  onSubmit,
}: CreateNewPlanModelProps) => {
  const [isHavePlan, setIsHavePlan] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const [type, setType] = useState<"domestic" | "international">("domestic");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0].split("-").reverse().join("/")
  );
  const [endDate, setEndDate] = useState("");
  const [NumberOfDays, setNumberOfDays] = useState("");
  const [NumberOfParticipants, setNumberOfParticipants] = useState("");
  const [Budget, setBudget] = useState("");
  const [Destination, setDestination] = useState("");
  // Removed Interests state, using selectedInterests instead

  // New states for API data and UI
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const keyboardBehavior = Platform.OS === "ios" ? "padding" : "height";
  const keyboardVerticalOffset = Platform.OS === "android" ? 24 : 0;

  useEffect(() => {
    if (!visible) {
      setIsHavePlan(true);
      setType("domestic");
      setNumberOfDays("");
      setBudget("");
      setDestination("");
      setCurrentStep(0);
      // Removed setInterests
      setStartDate(
        new Date().toISOString().split("T")[0].split("-").reverse().join("/")
      );
      setEndDate("");
      setNumberOfParticipants("");
    }
  }, [visible]);

  const handleStep1Next = () => {
    if (isHavePlan) {
      setCurrentStep(2); // Skip to Step 3
    } else {
      setCurrentStep(1); // Go to Step 2
    }
  };

  const handleStep2Next = () => {
    setCurrentStep(2);
  };

  const handleStep3Next = () => {
    setCurrentStep(3);
  };

  const handleStepBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStep3Back = () => {
    if (isHavePlan) {
      setCurrentStep(0); // Go back to Step 1
    } else {
      setCurrentStep(1); // Go back to Step 2
    }
  };

  const handleSubmit = async () => {
    const isValidForExistingPlan =
      isHavePlan &&
      Destination &&
      startDate &&
      endDate &&
      NumberOfParticipants &&
      Budget;
    const isValidForNewPlan =
      !isHavePlan && startDate && endDate && NumberOfParticipants && Budget;
    if (!isValidForExistingPlan && !isValidForNewPlan) return;

    setIsSubmitting(true);
    try {
      const location = await getUserLocation();
      if (!location) throw new Error("Could not get user location");

      const destination = isHavePlan
        ? Destination
        : getRandomDestination(location);
      const tripDuration = Math.ceil(
        (new Date(endDate.split("/").reverse().join("-")).getTime() -
          new Date(startDate.split("/").reverse().join("-")).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const interestsString = selectedInterests.join(", ");
      const numericBudget = parseInt(Budget) || 500;
      let budgetCategory = "moderate";
      if (numericBudget >= 2000) budgetCategory = "high";
      else if (numericBudget >= 500) budgetCategory = "moderate";
      else budgetCategory = "low";

      const [flight, hotel, itinerary] = await Promise.all([
        fetchFlightData(
          location,
          destination,
          startDate.split("/").reverse().join("-"),
          endDate.split("/").reverse().join("-")
        ),
        fetchHotelData(
          destination,
          startDate.split("/").reverse().join("-"),
          endDate.split("/").reverse().join("-"),
          NumberOfParticipants
        ),
        fetchItineraryData(
          destination,
          tripDuration,
          interestsString,
          budgetCategory,
          parseInt(NumberOfParticipants) || 2
        ),
      ]);

      const dataToSend = {
        hasExistingPlan: isHavePlan,
        travelType: type,
        destination,
        startDate,
        endDate,
        participants: NumberOfParticipants,
        budget: Budget,
        flightData: flight,
        hotelData: hotel,
        itineraryData: itinerary,
        selectedInterests,
        userLocation: location,
      };

      await AsyncStorage.setItem("travelPlanData", JSON.stringify(dataToSend));
      console.log(dataToSend);

      onSubmit({
        type,
        startDate,
        endDate,
        NumberOfDays,
        NumberOfParticipants,
        Budget,
        Destination: destination,
      });

      router.push({
        pathname: "/plan/plan-result",
        params: { from: "create-new-plan" },
      });
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // API Functions
  const getUserLocation = async (): Promise<{
    lat: number;
    lon: number;
  } | null> => {
    try {
      console.log("🌍 Getting user location...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("❌ Location permission denied");
        const defaultLocation = { lat: 10.7769, lon: 106.7009 };
        console.log("📍 Using default location:", defaultLocation);
        return defaultLocation;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userLocation = {
        lat: location.coords.latitude,
        lon: location.coords.longitude,
      };
      console.log("✅ User location obtained:", userLocation);
      return userLocation;
    } catch (error) {
      console.error("❌ Error getting location:", error);
      const defaultLocation = { lat: 10.7769, lon: 106.7009 };
      console.log("📍 Using default location after error:", defaultLocation);
      return defaultLocation;
    }
  };

  const fetchFlightData = async (
    location: { lat: number; lon: number },
    destination: string,
    startDate: string,
    endDate: string
  ) => {
    const requestData = {
      departure_lat: location.lat,
      departure_lon: location.lon,
      arrival_city: destination,
      outbound_date: startDate,
      return_date: endDate,
      sort_criteria: "score",
      limit: 3,
    };
    try {
      const response = await fetch(
        `${Constants.expoConfig?.extra?.env?.BE_DOMAIN}:${Constants.expoConfig?.extra?.env?.BE_PORT}/flights/search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }
      );
      if (response.ok || response.status === 400) {
        const data = await response.json();
        if (
          response.status === 400 ||
          (data.message &&
            (data.message.includes("No flights found") ||
              data.message.includes("Found 0 flights")))
        ) {
          return {
            success: false,
            message: data.message || "No flights found",
            no_flights_found: true,
            destination,
          };
        }
        return data;
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error fetching flight data:", error);
      return null;
    }
  };

  const fetchHotelData = async (
    destination: string,
    startDate: string,
    endDate: string,
    participants: string
  ) => {
    const requestData = {
      location: destination,
      check_in_date: startDate,
      check_out_date: endDate,
      adults: parseInt(participants) || 2,
      limit: 5,
    };
    try {
      const response = await fetch(
        `${Constants.expoConfig?.extra?.env?.BE_DOMAIN}:${Constants.expoConfig?.extra?.env?.BE_PORT}/hotels/search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }
      );
      if (response.ok || response.status === 400) {
        const data = await response.json();
        if (
          response.status === 400 ||
          (data.message &&
            (data.message.includes("No hotels found") ||
              data.message.includes("Found 0 hotels")))
        ) {
          return {
            success: false,
            message: data.message || "No hotels found",
            no_hotels_found: true,
            destination,
          };
        }
        return data;
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error fetching hotel data:", error);
      return null;
    }
  };

  const fetchItineraryData = async (
    destination: string,
    days: number,
    interests: string,
    budget: string,
    groupSize: number
  ) => {
    const requestData = {
      city: destination,
      days,
      interests,
      budget,
      group_size: groupSize,
    };
    try {
      const response = await fetch(
        `${Constants.expoConfig?.extra?.env?.BE_DOMAIN}:${Constants.expoConfig?.extra?.env?.BE_PORT}/agent/itinerary`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }
      );
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error fetching itinerary data:", error);
      return null;
    }
  };

  const getRandomDestination = (userLocation: {
    lat: number;
    lon: number;
  }): string => {
    const isInVietnam =
      userLocation.lat >= 8.2 &&
      userLocation.lat <= 23.4 &&
      userLocation.lon >= 102.1 &&
      userLocation.lon <= 109.5;
    const domesticDestinations = [
      "Ho Chi Minh City",
      "Da Nang",
      "Nha Trang",
      "Hoi An",
      "Ha Long",
      "Phu Quoc",
      "Da Lat",
      "Can Tho",
      "Hue",
      "Sapa",
    ];
    const internationalDestinations = [
      "Bangkok",
      "Singapore",
      "Kuala Lumpur",
      "Jakarta",
      "Manila",
      "Seoul",
      "Tokyo",
      "Taipei",
      "Hong Kong",
      "Phnom Penh",
    ];
    let destinations: string[];
    if (type === "domestic") {
      destinations = isInVietnam
        ? domesticDestinations
        : ["Ho Chi Minh City", "Hanoi"];
    } else {
      destinations = internationalDestinations;
    }
    return destinations[Math.floor(Math.random() * destinations.length)];
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={[
            styles.modalContent,
            { height: isHavePlan && currentStep === 2 ? 550 : 500 },
          ]}
          behavior={keyboardBehavior}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row" }}>
              <Ionicons
                name="location-outline"
                color={Colors.GREEN}
                size={22}
                style={styles.headerIcon}
              />
              <Text style={styles.headerTitle}>Create New Plan</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.GRAY} />
            </TouchableOpacity>
          </View>

          {/* Progress Steps */}
          <ProgressSteps
            activeStep={currentStep}
            borderWidth={4}
            activeStepIconBorderColor={Colors.GREEN}
            activeLabelColor={Colors.GREEN}
            activeStepNumColor={Colors.WHITE}
            activeStepIconColor="transparent"
            completedStepIconColor={Colors.GREEN}
            completedProgressBarColor={Colors.GREEN}
            completedLabelColor="transparent"
            disabledStepNumColor="#EBEBE4"
            topOffset={0}
            marginBottom={-10}
          >
            {/* Step 1 */}
            <ProgressStep
              buttonFillColor={Colors.GREEN}
              onNext={handleStep1Next}
              buttonNextDisabled={false}
              buttonNextText="Next"
              removeBtnRow={false}
            >
              <Step1 isHavePlan={isHavePlan} setIsHavePlan={setIsHavePlan} />
            </ProgressStep>
            {/* Step 2 */}
            <ProgressStep
              buttonFillColor={Colors.GREEN}
              buttonPreviousText="Back"
              onNext={handleStep2Next}
              onPrevious={handleStepBack}
              buttonNextText="Next"
            >
              <Step2 type={type} setType={setType} />
            </ProgressStep>
            {/* Step 3 */}
            <ProgressStep
              buttonFillColor={Colors.GREEN}
              buttonPreviousText="Back"
              onNext={handleStep3Next}
              onPrevious={handleStep3Back}
              buttonNextText="Next"
              buttonNextDisabled={
                !startDate || !endDate || !NumberOfParticipants || !Budget
              }
            >
              <Step3
                isHavePlan={isHavePlan}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                numberOfParticipants={NumberOfParticipants}
                setNumberOfParticipants={setNumberOfParticipants}
                budget={Budget}
                setBudget={setBudget}
                destination={Destination}
                setDestination={setDestination}
              />
            </ProgressStep>
            {/* Step 4 */}
            <ProgressStep
              buttonFillColor={Colors.GREEN}
              buttonPreviousText="Back"
              onPrevious={handleStepBack}
              onSubmit={handleSubmit}
              buttonFinishDisabled={selectedInterests.length === 0}
              buttonDisabledColor={Colors.GREEN + "80"}
            >
              <Step4
                interests={selectedInterests}
                setInterests={setSelectedInterests}
              />
            </ProgressStep>
          </ProgressSteps>
        </KeyboardAvoidingView>
      </View>
      <LoadingModal visible={isSubmitting} />
    </Modal>
  );
};

export default CreateNewPlanModel;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: 500,
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 20,
  },
  headerIcon: {
    backgroundColor: "#e6f4ea",
    borderRadius: 50,
    padding: 4,
    verticalAlign: "middle",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "inter-medium",
    marginLeft: 8,
  },
});
