import { Colors } from "@/constant/Colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type ChatMessageProps = {
  sender: "assistant" | "user";
  text: string;
  time: string;
};

const ChatMessage = ({ sender, text, time }: ChatMessageProps) => {
  return (
    <View
      style={
        sender === "assistant" ? styles.assistantMsgWrap : styles.userMsgWrap
      }
    >
      <View
        style={sender === "assistant" ? styles.assistantMsg : styles.userMsg}
      >
        <Text
          style={[
            sender === "assistant"
              ? styles.assistantMsgText
              : styles.userMsgText,
          ]}
        >
          {text}
        </Text>
      </View>
      <Text style={styles.msgTime}>{time}</Text>
    </View>
  );
};

export default ChatMessage;

const styles = StyleSheet.create({
  assistantMsgWrap: {
    alignSelf: "flex-start",
    maxWidth: "80%",
    marginBottom: 12,
  },
  assistantMsg: {
    backgroundColor: Colors.WHITE,
    borderRadius: 14,
    padding: 14,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  userMsgWrap: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    marginBottom: 12,
  },
  userMsg: {
    backgroundColor: Colors.GREEN,
    borderRadius: 14,
    padding: 14,
  },
  userMsgText: {
    fontSize: 15,
    fontFamily: "inter-regular",
    color: Colors.WHITE,
  },
  assistantMsgText: {
    fontSize: 15,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
  },
  msgTime: {
    fontSize: 11,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    marginTop: 2,
    textAlign: "right",
  },
});
