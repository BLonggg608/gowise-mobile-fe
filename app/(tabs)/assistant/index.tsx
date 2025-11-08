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

// Dữ liệu chat mẫu, thay thế bằng API sau
const initialChats = [
  {
    id: "general",
    title: "Trò chuyện chung",
    subtitle: "Hỗ trợ du lịch tổng quát",
  },
  {
    id: "tokyo",
    title: "Khám phá Tokyo",
    subtitle: "Nhật Bản",
  },
  {
    id: "europe",
    title: "Châu Âu phiêu lưu ký",
    subtitle: "Châu Âu",
  },
  {
    id: "bali",
    title: "Kỳ nghỉ Bali",
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
        text: "Xin chào! Tôi là Trợ lý Du lịch AI của bạn. Tôi có thể giúp gì cho chuyến đi sắp tới của bạn?",
        time: "10:30",
      },
    ],
    tokyo: [
      {
        id: "m1",
        sender: "assistant" as "assistant",
        text: "Xin chào! Tôi là Trợ lý Du lịch AI của bạn. Tôi có thể giúp gì cho chuyến đi sắp tới của bạn?",
        time: "10:30",
      },
      {
        id: "m2",
        sender: "user" as "user",
        text: "Tôi muốn lên kế hoạch đi Tokyo 7 ngày. Những địa điểm nào nên ghé thăm?",
        time: "10:32",
      },
      {
        id: "m3",
        sender: "assistant" as "assistant",
        text: "Lựa chọn tuyệt vời! Cho chuyến đi Tokyo 7 ngày, tôi gợi ý bạn nên ghé thăm:\n\n• Chùa Senso-ji ở Asakusa\n• Ngã tư Shibuya\n• Tháp Tokyo Skytree\n• Đền Meiji\n• Chợ cá Tsukiji\n• Khu Harajuku\n• Vườn Hoàng gia\n\nBạn có muốn tôi lên lịch trình chi tiết cho từng ngày không?",
        time: "10:33",
      },
    ],
    europe: [
      {
        id: "m1",
        sender: "assistant" as "assistant",
        text: "Xin chào! Tôi là Trợ lý Du lịch AI của bạn. Tôi có thể giúp gì cho chuyến đi sắp tới của bạn?",
        time: "10:30",
      },
    ],
    bali: [
      {
        id: "m1",
        sender: "assistant" as "assistant",
        text: "Xin chào! Tôi là Trợ lý Du lịch AI của bạn. Tôi có thể giúp gì cho chuyến đi sắp tới của bạn?",
        time: "10:30",
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
