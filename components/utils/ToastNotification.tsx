import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, Text, TouchableWithoutFeedback, View } from "react-native";
import { ToastConfigParams } from "toastify-react-native/utils/interfaces";

const ToastNotification = ({
  props,
  type,
}: {
  props: ToastConfigParams;
  type: string;
}) => {
  const getIconName = () => {
    switch (type) {
      case "success":
        return "checkmark-sharp";
      case "error":
        return "close-sharp";
      case "info":
        return "information-circle-sharp";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return Colors.LIGHT_GREEN;
      case "error":
        return Colors.RED;
      case "info":
        return Colors.YELLOW;
    }
  };

  return (
    <TouchableWithoutFeedback onPress={props.hide}>
      <View
        style={{
          backgroundColor: Colors.WHITE,
          padding: 16,
          borderRadius: 20,
          width: "80%",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Ionicons
          name={getIconName()}
          size={props.text2 ? 40 : 34}
          color={getIconColor()}
          style={{
            position: "absolute",
            //   if ios and has text2, 13 else 7
            //   if android and has text2, 16 else 9
            top:
              Platform.OS === "ios"
                ? props.text2
                  ? 13
                  : 7
                : props.text2
                ? 16
                : 9,
            left: 12,
          }}
        />
        <View>
          <Text
            style={{
              color: Colors.BLACK,
              fontFamily: "inter-bold",
              textAlign: "center",
              fontSize: props.text2 ? 14 : 12,
              marginBottom: props.text2 ? 2 : 0,
              paddingHorizontal: 30,
            }}
          >
            {props.text1}
          </Text>
          {props.text2 && (
            <Text
              style={{
                color: Colors.GRAY,
                fontFamily: "inter-regular",
                textAlign: "center",
                fontSize: 12,
                paddingHorizontal: 30,
              }}
            >
              {props.text2}
            </Text>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ToastNotification;
