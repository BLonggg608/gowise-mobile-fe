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
} from "react-native";
import { ProgressStep, ProgressSteps } from "react-native-progress-steps";
import Step1 from "./Step/Step1";
import Step2 from "./Step/Step2";
import Step3 from "./Step/Step3";
import Step4 from "./Step/Step4";

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
  const [Interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) {
      setIsHavePlan(true);
      setType("domestic");
      setNumberOfDays("");
      setBudget("");
      setDestination("");
      setCurrentStep(0);
      setInterests([]);
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

  const handleSubmit = () => {
    if (!type || !startDate || !endDate || !Budget) return; // Kiểm tra đầy đủ thông tin
    // Calculate NumberOfDays
    const start = new Date(startDate.split("/").reverse().join("-"));
    const end = new Date(endDate.split("/").reverse().join("-"));

    setNumberOfDays(
      ((end.getTime() - start.getTime()) / (1000 * 3600 * 24)).toString()
    );
    onSubmit({
      type,
      startDate,
      endDate,
      NumberOfDays,
      NumberOfParticipants,
      Budget,
      Destination,
    });
    onClose();
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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
              buttonFinishDisabled={Interests.length === 0}
              buttonDisabledColor={Colors.GREEN + "80"}
            >
              <Step4 interests={Interests} setInterests={setInterests} />
            </ProgressStep>
          </ProgressSteps>
        </KeyboardAvoidingView>
      </View>
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
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "inter-medium",
    marginLeft: 8,
  },
});
