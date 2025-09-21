import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export type ChatInputProps = {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
};

const ChatInput = ({ value, onChange, onSend }: ChatInputProps) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={{ width: "100%" }}
  >
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="Type your message..."
        placeholderTextColor={Colors.GRAY}
        multiline
      />
      <TouchableOpacity style={styles.sendBtn} onPress={onSend}>
        <Ionicons name="send" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  </KeyboardAvoidingView>
);

export default ChatInput;

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: Colors.WHITE,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: Colors.GREEN,
    borderRadius: 24,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: Colors.GREEN,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
