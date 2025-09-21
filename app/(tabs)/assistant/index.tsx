import ChatInput from "@/components/Assistant/ChatInput";
import ChatList from "@/components/Assistant/ChatList";
import Header from "@/components/Assistant/ChatHeader";
import SliderMenu from "@/components/Assistant/ChatSliderMenu";
import React, { useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";

// Dummy chat data, replace with API later
const initialChats = [
  {
    id: "general",
    title: "General Chat",
    subtitle: "General travel assistance",
  },
  {
    id: "tokyo",
    title: "Tokyo Adventure",
    subtitle: "Japan",
  },
  {
    id: "europe",
    title: "European Explorer",
    subtitle: "Europe",
  },
  {
    id: "bali",
    title: "Bali Retreat",
    subtitle: "Indonesia",
  },
];

const Assistant = () => {
  const [sliderOpen, setSliderOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState("general");
  const [input, setInput] = useState("");
  const [chats] = useState(initialChats);
  type Message = {
    id: string;
    sender: "assistant" | "user";
    text: string;
    time: string;
  };
  type MessagesByChat = {
    [chatId: string]: Message[];
  };
  const [messagesByChat, setMessagesByChat] = useState<MessagesByChat>({
    general: [
      {
        id: "m1",
        sender: "assistant" as "assistant",
        text: "Hello! I'm your AI Travel Assistant. How can I help you plan your next adventure?",
        time: "10:30 AM",
      },
    ],
    tokyo: [
      {
        id: "m1",
        sender: "assistant" as "assistant",
        text: "Hello! I'm your AI Travel Assistant. How can I help you plan your next adventure?",
        time: "10:30 AM",
      },
      {
        id: "m2",
        sender: "user" as "user",
        text: "I want to plan a trip to Tokyo for 7 days. What are the must-visit places?",
        time: "10:32 AM",
      },
      {
        id: "m3",
        sender: "assistant" as "assistant",
        text: "Great choice! For a 7-day Tokyo trip, I recommend visiting:\n\n• Senso-ji Temple in Asakusa\n• Shibuya Crossing\n• Tokyo Skytree\n• Meiji Shrine\n• Tsukiji Fish Market\n• Harajuku District\n• Imperial Palace Gardens\n\nWould you like me to create a detailed itinerary for each day?",
        time: "10:33 AM",
      },
    ],
    europe: [
      {
        id: "m1",
        sender: "assistant" as "assistant",
        text: "Hello! I'm your AI Travel Assistant. How can I help you plan your next adventure?",
        time: "10:30 AM",
      },
    ],
    bali: [
      {
        id: "m1",
        sender: "assistant" as "assistant",
        text: "Hello! I'm your AI Travel Assistant. How can I help you plan your next adventure?",
        time: "10:30 AM",
      },
    ],
  });
  const sliderAnim = React.useRef(new Animated.Value(0)).current;

  // Handle slider animation
  const openSlider = () => {
    setSliderOpen(true);
    Animated.timing(sliderAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };
  const closeSlider = () => {
    Animated.timing(sliderAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setSliderOpen(false));
  };

  // Get current chat info
  const currentChat = chats.find((c) => c.id === selectedChatId) || chats[0];
  const currentMessages = messagesByChat[selectedChatId] || [];

  // Send message (dummy, replace with API)
  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      sender: "user",
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessagesByChat((prev) => ({
      ...prev,
      [selectedChatId]: [...(prev[selectedChatId] || []), newMsg],
    }));
    setInput("");
    // Call API here if needed
  };

  return (
    <View style={styles.container}>
      {/* Header with menu button */}
      <Header subtitle={currentChat.subtitle} onMenuPress={openSlider} />

      {/* Slider menu for chat selection */}
      <SliderMenu
        open={sliderOpen}
        sliderAnim={sliderAnim}
        chats={chats}
        selectedChatId={selectedChatId}
        onSelect={setSelectedChatId}
        onClose={closeSlider}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Main chat area */}
        <ChatList messages={currentMessages} />
        <ChatInput value={input} onChange={setInput} onSend={sendMessage} />
      </KeyboardAvoidingView>
    </View>
  );
};

export default Assistant;

const styles = StyleSheet.create({
  // Only keep styles used in this file
  container: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
});
