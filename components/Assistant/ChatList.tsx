import React from "react";
import { FlatList } from "react-native";
import ChatMessage, { ChatMessageProps } from "./ChatMessage";

export type ChatListProps = {
  messages: ChatMessageProps[];
};

const ChatList = ({ messages }: ChatListProps) => {
  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.time + item.text}
      renderItem={({ item }) => <ChatMessage {...item} />}
      contentContainerStyle={{
        paddingBottom: 100,
        paddingHorizontal: 18,
        marginTop: 18,
      }}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default ChatList;
