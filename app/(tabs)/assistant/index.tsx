import ChatInput from "@/components/Assistant/ChatInput";
import ChatList from "@/components/Assistant/ChatList";
import Header from "@/components/Assistant/Header";
import SliderMenu from "@/components/Assistant/SliderMenu";
import React, { useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

// Dummy chat data, replace with API later
const initialChats = [
  {
    id: "general",
    title: "General Chat",
    subtitle: "General travel assistance",
    messages: [
      {
        id: "m1",
        sender: "assistant",
        text: "Hello! I'm your AI Travel Assistant. How can I help you plan your next adventure?",
        time: "10:30 AM",
      },
    ],
  },
  {
    id: "tokyo",
    title: "Tokyo Adventure",
    subtitle: "Japan",
    messages: [
      {
        id: "m1",
        sender: "assistant",
        text: "Hello! I'm your AI Travel Assistant. How can I help you plan your next adventure?",
        time: "10:30 AM",
      },
      {
        id: "m2",
        sender: "user",
        text: "I want to plan a trip to Tokyo for 7 days. What are the must-visit places?",
        time: "10:32 AM",
      },
      {
        id: "m3",
        sender: "assistant",
        text: "Great choice! For a 7-day Tokyo trip, I recommend visiting:\n\n• Senso-ji Temple in Asakusa\n• Shibuya Crossing\n• Tokyo Skytree\n• Meiji Shrine\n• Tsukiji Fish Market\n• Harajuku District\n• Imperial Palace Gardens\n\nWould you like me to create a detailed itinerary for each day?",
        time: "10:33 AM",
      },
    ],
  },
  {
    id: "europe",
    title: "European Explorer",
    subtitle: "Europe",
    messages: [
      {
        id: "m1",
        sender: "assistant",
        text: "Hello! I'm your AI Travel Assistant. How can I help you plan your next adventure?",
        time: "10:30 AM",
      },
    ],
  },
  {
    id: "bali",
    title: "Bali Retreat",
    subtitle: "Indonesia",
    messages: [
      {
        id: "m1",
        sender: "assistant",
        text: "Hello! I'm your AI Travel Assistant. How can I help you plan your next adventure?",
        time: "10:30 AM",
      },
    ],
  },
];

const Assistant = () => {
  const [sliderOpen, setSliderOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState("general");
  const [input, setInput] = useState("");
  const [chats, setChats] = useState(initialChats);
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

  // Get current chat
  const currentChat = chats.find((c) => c.id === selectedChatId) || chats[0];

  // Send message (dummy, replace with API)
  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: `m${Date.now()}`,
      sender: "user",
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChatId
          ? { ...chat, messages: [...chat.messages, newMsg] }
          : chat
      )
    );
    setInput("");
    // Call API here if needed
  };

  return (
    <View style={styles.container}>
      {/* Slider menu for chat selection */}
      <SliderMenu
        open={sliderOpen}
        sliderAnim={sliderAnim}
        chats={chats}
        selectedChatId={selectedChatId}
        onSelect={setSelectedChatId}
        onClose={closeSlider}
      />

      {/* Main chat area without KeyboardAvoidingView */}
      <Animated.View style={styles.chatArea}>
        <Header subtitle={currentChat.subtitle} onMenuPress={openSlider} />
        <ChatList
          messages={currentChat.messages.map(({ sender, ...rest }) => ({
            sender: sender === "assistant" ? "assistant" : "user",
            ...rest,
          }))}
        />
        <ChatInput value={input} onChange={setInput} onSend={sendMessage} />
      </Animated.View>
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
