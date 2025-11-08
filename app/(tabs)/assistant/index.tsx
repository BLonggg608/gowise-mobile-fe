import ChatInput from "@/components/Assistant/ChatInput";
import ChatList from "@/components/Assistant/ChatList";
import Header from "@/components/Assistant/ChatHeader";
import SliderMenu from "@/components/Assistant/ChatSliderMenu";
import { ChatMessageProps } from "@/components/Assistant/ChatMessage";
import { Colors } from "@/constant/Colors";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "toastify-react-native";

const GENERAL_CHAT_ID = "general";
const GENERAL_CHAT_TITLE = "Trò chuyện chung";
const GENERAL_CHAT_SUBTITLE = "Hỗ trợ du lịch tổng quát";
const GENERAL_WELCOME_TEXT =
  "Xin chào! Tôi là Trợ lý Du lịch AI của bạn. Tôi có thể giúp gì cho chuyến đi sắp tới của bạn?";

type Message = ChatMessageProps & { id: string };
type MessagesByChat = Record<string, Message[]>;

type ApiPlan = {
  _id?: { $oid?: string };
  id?: string;
  plan_id?: string;
  planId?: string;
  planID?: string;
  name?: string;
  title?: string;
  destination?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  budget?: number | string;
  selectedInterests?: unknown;
  plan_content?: Record<string, unknown>;
  planContent?: Record<string, unknown>;
  [key: string]: unknown;
};

type ChatItem = {
  id: string;
  title: string;
  subtitle?: string;
  type: "general" | "plan";
  raw?: ApiPlan;
};

const createMessageId = () =>
  `m${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getTextValue = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getPlanContent = (plan: ApiPlan) =>
  (plan.plan_content ?? plan.planContent ?? {}) as Record<string, unknown>;

const getPlanIdentifier = (plan: ApiPlan) => {
  const content = getPlanContent(plan);
  return (
    plan._id?.$oid ||
    getTextValue(plan.plan_id) ||
    getTextValue(plan.planId) ||
    getTextValue(plan.planID) ||
    getTextValue(plan.id) ||
    getTextValue(content["plan_id"]) ||
    getTextValue(content["planId"]) ||
    getTextValue(content["planID"])
  );
};

const transformPlanToChat = (plan: ApiPlan, index: number): ChatItem | null => {
  const id = getPlanIdentifier(plan);
  if (!id) return null;

  const content = getPlanContent(plan);
  const destination =
    getTextValue(content["destination"]) ||
    getTextValue(plan.destination) ||
    getTextValue(content["location"]) ||
    getTextValue(plan.location);

  const title =
    getTextValue(plan.name) ||
    getTextValue(plan.title) ||
    getTextValue(content["name"]) ||
    getTextValue(content["planName"]) ||
    getTextValue(content["plan_title"]) ||
    (destination ? `Kế hoạch: ${destination}` : `Kế hoạch ${index + 1}`);

  const subtitle =
    destination ||
    getTextValue(content["location"]) ||
    getTextValue(plan.location) ||
    undefined;

  return {
    id,
    title,
    subtitle,
    type: "plan",
    raw: plan,
  };
};

const createPlanIntroMessage = (chat: ChatItem) => {
  const location = chat.subtitle?.trim();
  if (location) {
    return `Chào mừng đến với ${chat.title}! Tôi ở đây để giúp bạn với kế hoạch du lịch ${location}. Nhấn "Bắt đầu trò chuyện" để bắt đầu.`;
  }
  return `Chào mừng đến với ${chat.title}! Tôi ở đây để giúp bạn với kế hoạch du lịch của bạn. Nhấn "Bắt đầu trò chuyện" để bắt đầu.`;
};

const formatTime = (date = new Date()) => {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }
};

const createAssistantMessage = (text: string): Message => ({
  id: createMessageId(),
  sender: "assistant",
  text,
  time: formatTime(new Date()),
});

const createUserMessage = (text: string): Message => ({
  id: createMessageId(),
  sender: "user",
  text,
  time: formatTime(new Date()),
});

const buildApiUrl = (path: string) => {
  const domainRaw = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  if (!domainRaw) {
    throw new Error("Thiếu cấu hình máy chủ");
  }
  const portRaw = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";
  const domain = domainRaw.endsWith("/") ? domainRaw.slice(0, -1) : domainRaw;
  const formattedPath = path.startsWith("/") ? path : `/${path}`;
  return portRaw
    ? `${domain}:${portRaw}${formattedPath}`
    : `${domain}${formattedPath}`;
};

const Assistant = () => {
  const [sliderOpen, setSliderOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(GENERAL_CHAT_ID);
  const [input, setInput] = useState("");
  const [chats, setChats] = useState<ChatItem[]>([
    {
      id: GENERAL_CHAT_ID,
      title: GENERAL_CHAT_TITLE,
      subtitle: GENERAL_CHAT_SUBTITLE,
      type: "general",
    },
  ]);
  const [messagesByChat, setMessagesByChat] = useState<MessagesByChat>(() => ({
    [GENERAL_CHAT_ID]: [createAssistantMessage(GENERAL_WELCOME_TEXT)],
  }));
  const [planChatReady, setPlanChatReady] = useState<Record<string, boolean>>({
    [GENERAL_CHAT_ID]: true,
  });
  const [isStartingChatMap, setIsStartingChatMap] = useState<
    Record<string, boolean>
  >({});
  const [isSending, setIsSending] = useState(false);
  const sliderAnim = React.useRef(new Animated.Value(0)).current;

  const fetchPlans = useCallback(async () => {
    try {
      const userId = await getUserIdFromToken();
      const generalChat: ChatItem = {
        id: GENERAL_CHAT_ID,
        title: GENERAL_CHAT_TITLE,
        subtitle: GENERAL_CHAT_SUBTITLE,
        type: "general",
      };

      if (!userId) {
        setChats([generalChat]);
        setPlanChatReady({ [GENERAL_CHAT_ID]: true });
        setMessagesByChat((prev) => ({
          [GENERAL_CHAT_ID]:
            prev[GENERAL_CHAT_ID] && prev[GENERAL_CHAT_ID].length > 0
              ? prev[GENERAL_CHAT_ID]
              : [createAssistantMessage(GENERAL_WELCOME_TEXT)],
        }));
        return;
      }

      const endpoint = buildApiUrl(`/plans/${userId}`);
      const response = await fetch(endpoint, { method: "GET" });
      if (!response.ok) {
        throw new Error(
          "Không thể tải danh sách kế hoạch. Vui lòng thử lại sau."
        );
      }

      const data = await response.json();
      const rawPlans: ApiPlan[] = Array.isArray(data?.plans)
        ? data.plans
        : Array.isArray(data)
        ? data
        : [];

      const planChats = rawPlans
        .map((plan, index) => transformPlanToChat(plan, index))
        .filter((item): item is ChatItem => Boolean(item));

      const mergedChats = [generalChat, ...planChats];
      setChats(mergedChats);

      setPlanChatReady((prev) => {
        const next: Record<string, boolean> = { [GENERAL_CHAT_ID]: true };
        planChats.forEach((chat) => {
          next[chat.id] = prev[chat.id] ?? false;
        });
        return next;
      });

      setIsStartingChatMap((prev) => {
        const next: Record<string, boolean> = {};
        planChats.forEach((chat) => {
          if (prev[chat.id]) {
            next[chat.id] = prev[chat.id];
          }
        });
        return next;
      });

      setMessagesByChat((prev) => {
        const next: MessagesByChat = {};
        mergedChats.forEach((chat) => {
          if (prev[chat.id] && prev[chat.id].length > 0) {
            next[chat.id] = prev[chat.id];
          }
        });

        if (!next[GENERAL_CHAT_ID] || next[GENERAL_CHAT_ID].length === 0) {
          next[GENERAL_CHAT_ID] = [
            createAssistantMessage(GENERAL_WELCOME_TEXT),
          ];
        }

        planChats.forEach((chat) => {
          if (!next[chat.id] || next[chat.id].length === 0) {
            next[chat.id] = [
              createAssistantMessage(createPlanIntroMessage(chat)),
            ];
          }
        });

        return next;
      });

      setSelectedChatId((prev) => {
        if (mergedChats.some((chat) => chat.id === prev)) {
          return prev;
        }
        return GENERAL_CHAT_ID;
      });
    } catch (error) {
      console.error("[assistant] fetchPlans error", error);
      Toast.show({
        type: "error",
        text1: "Không thể tải kế hoạch",
        text2:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi, vui lòng thử lại sau.",
      });
      const generalChat: ChatItem = {
        id: GENERAL_CHAT_ID,
        title: GENERAL_CHAT_TITLE,
        subtitle: GENERAL_CHAT_SUBTITLE,
        type: "general",
      };
      setChats([generalChat]);
      setPlanChatReady({ [GENERAL_CHAT_ID]: true });
      setMessagesByChat((prev) => ({
        [GENERAL_CHAT_ID]:
          prev[GENERAL_CHAT_ID] && prev[GENERAL_CHAT_ID].length > 0
            ? prev[GENERAL_CHAT_ID]
            : [createAssistantMessage(GENERAL_WELCOME_TEXT)],
      }));
      setSelectedChatId(GENERAL_CHAT_ID);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [fetchPlans])
  );

  const openSlider = useCallback(() => {
    setSliderOpen(true);
    Animated.timing(sliderAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [sliderAnim]);

  const closeSlider = useCallback(() => {
    Animated.timing(sliderAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setSliderOpen(false));
  }, [sliderAnim]);

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    setInput("");
  }, []);

  const startPlanChat = useCallback(
    async (chatId: string) => {
      const chat = chats.find(
        (item) => item.id === chatId && item.type === "plan"
      );
      if (!chat || planChatReady[chatId]) {
        return;
      }

      setIsStartingChatMap((prev) => ({ ...prev, [chatId]: true }));

      try {
        const userId = await getUserIdFromToken();
        if (!userId) {
          throw new Error(
            "Không thể xác định người dùng. Vui lòng đăng nhập lại."
          );
        }

        const detailEndpoint = buildApiUrl(`/plans/${userId}/${chatId}`);
        const detailResponse = await fetch(detailEndpoint, { method: "GET" });
        if (!detailResponse.ok) {
          throw new Error("Không thể tải chi tiết kế hoạch.");
        }

        const detailData = await detailResponse.json();
        const rawPlan = (detailData?.plan ?? detailData) as ApiPlan;
        const planContent = getPlanContent(rawPlan);

        const destinationValue =
          getTextValue(rawPlan.destination) ||
          getTextValue(planContent["destination"]);
        const startDateValue =
          getTextValue(rawPlan.startDate) ||
          getTextValue(planContent["startDate"]) ||
          getTextValue(planContent["start_date"]);
        const endDateValue =
          getTextValue(rawPlan.endDate) ||
          getTextValue(planContent["endDate"]) ||
          getTextValue(planContent["end_date"]);

        const budgetValue = (() => {
          const candidate = rawPlan.budget ?? planContent["budget"];
          if (typeof candidate === "number") return candidate;
          if (typeof candidate === "string" && candidate.trim().length > 0)
            return candidate;
          return undefined;
        })();

        const selectedInterestsValue =
          rawPlan.selectedInterests ?? planContent["selectedInterests"];

        const planIdValue =
          getPlanIdentifier(rawPlan) ||
          getTextValue(planContent["plan_id"]) ||
          getTextValue(planContent["planId"]);

        const planData = Object.fromEntries(
          Object.entries({
            destination: destinationValue,
            startDate: startDateValue,
            endDate: endDateValue,
            budget: budgetValue,
            plan_id: planIdValue,
            selectedInterests: selectedInterestsValue,
          }).filter(([, value]) => value !== undefined && value !== null)
        );

        const chatEndpoint = buildApiUrl("/chatbot/chat");
        const chatResponse = await fetch(chatEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message:
              "Đây là chi tiết kế hoạch du lịch của tôi. Vui lòng xem xét và hỗ trợ tôi.",
            plan_content: planData,
          }),
        });

        let aiText = "Sẵn sàng trò chuyện về kế hoạch của bạn!";
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          aiText =
            chatData.reply || chatData.message || chatData.response || aiText;
        } else if (chatResponse.status === 422) {
          aiText = "Vui lòng cung cấp thêm thông tin cho kế hoạch.";
        } else {
          throw new Error("Không thể kết nối tới trợ lý.");
        }

        setMessagesByChat((prev) => ({
          ...prev,
          [chatId]: [createAssistantMessage(aiText)],
        }));
        setPlanChatReady((prev) => ({ ...prev, [chatId]: true }));
      } catch (error) {
        console.error("[assistant] startPlanChat error", error);
        Toast.show({
          type: "error",
          text1: "Bắt đầu trò chuyện thất bại",
          text2:
            error instanceof Error
              ? error.message
              : "Không thể bắt đầu trò chuyện cho kế hoạch này.",
        });
        setMessagesByChat((prev) => {
          const existing = prev[chatId] ?? [];
          return {
            ...prev,
            [chatId]: [
              ...existing,
              createAssistantMessage(
                "Không thể bắt đầu trò chuyện cho kế hoạch này. Vui lòng thử lại sau."
              ),
            ],
          };
        });
      } finally {
        setIsStartingChatMap((prev) => ({ ...prev, [chatId]: false }));
      }
    },
    [chats, planChatReady]
  );

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const chat = chats.find((item) => item.id === selectedChatId);
    if (!chat) return;

    if (chat.type === "plan" && !planChatReady[chat.id]) {
      Toast.show({
        type: "info",
        text1: "Bắt đầu trò chuyện trước",
        text2: 'Nhấn "Bắt đầu trò chuyện" để cung cấp thông tin kế hoạch.',
      });
      return;
    }

    const userMsg = createUserMessage(trimmed);
    setMessagesByChat((prev) => ({
      ...prev,
      [chat.id]: [...(prev[chat.id] ?? []), userMsg],
    }));
    setInput("");
    setIsSending(true);

    try {
      const endpoint = buildApiUrl("/chatbot/chat");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      let aiText =
        response.status === 422
          ? "Vui lòng nhập tin nhắn hợp lệ."
          : "Xin lỗi, tôi chưa thể phản hồi ngay bây giờ.";

      if (response.ok) {
        const data = await response.json();
        aiText = data.reply || data.message || data.response || aiText;
      }

      setMessagesByChat((prev) => ({
        ...prev,
        [chat.id]: [...(prev[chat.id] ?? []), createAssistantMessage(aiText)],
      }));
    } catch (error) {
      console.error("[assistant] sendMessage error", error);
      setMessagesByChat((prev) => ({
        ...prev,
        [chat.id]: [
          ...(prev[chat.id] ?? []),
          createAssistantMessage(
            "Có lỗi xảy ra khi liên hệ với trợ lý. Vui lòng thử lại sau."
          ),
        ],
      }));
    } finally {
      setIsSending(false);
    }
  }, [input, chats, planChatReady, selectedChatId]);

  const currentChat =
    chats.find((chat) => chat.id === selectedChatId) ?? chats[0];
  const currentChatId = currentChat?.id ?? GENERAL_CHAT_ID;
  const currentMessages = messagesByChat[currentChatId] ?? [];
  const isPlanChat = currentChat?.type === "plan";
  const isCurrentChatReady = isPlanChat
    ? planChatReady[currentChatId] ?? false
    : true;
  const isStartingCurrentChat = isPlanChat
    ? Boolean(isStartingChatMap[currentChatId])
    : false;
  const sendDisabled = isSending || input.trim().length === 0;

  return (
    <View style={styles.container}>
      <Header subtitle={currentChat?.subtitle} onMenuPress={openSlider} />

      <SliderMenu
        open={sliderOpen}
        sliderAnim={sliderAnim}
        chats={chats}
        selectedChatId={selectedChatId}
        onSelect={handleSelectChat}
        onClose={closeSlider}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ChatList messages={currentMessages} />
        {isPlanChat && !isCurrentChatReady ? (
          <View style={styles.startChatContainer}>
            <TouchableOpacity
              style={[
                styles.startChatButton,
                isStartingCurrentChat && { opacity: 0.6 },
              ]}
              onPress={() => startPlanChat(currentChatId)}
              disabled={isStartingCurrentChat}
            >
              {isStartingCurrentChat ? (
                <ActivityIndicator color={Colors.WHITE} />
              ) : (
                <Text style={styles.startChatButtonText}>
                  Bắt đầu trò chuyện
                </Text>
              )}
            </TouchableOpacity>
            <Text style={styles.startChatHint}>
              Bạn cần bắt đầu trò chuyện cho kế hoạch này trước khi gửi tin
              nhắn.
            </Text>
          </View>
        ) : (
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            sendDisabled={sendDisabled}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

export default Assistant;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  startChatContainer: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: Colors.WHITE,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "center",
  },
  startChatButton: {
    width: "100%",
    backgroundColor: Colors.GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  startChatButtonText: {
    fontFamily: "inter-medium",
    fontSize: 16,
    color: Colors.WHITE,
  },
  startChatHint: {
    marginTop: 10,
    textAlign: "center",
    fontFamily: "inter-regular",
    fontSize: 12,
    color: Colors.GRAY,
  },
});
