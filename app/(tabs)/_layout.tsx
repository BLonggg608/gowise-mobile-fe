import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarActiveTintColor: Colors.GREEN,
        tabBarActiveBackgroundColor: "#F0FDFA",
        tabBarLabelStyle: { fontFamily: "inter-medium" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          tabBarLabel: "Plans",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="blog"
        options={{
          tabBarLabel: "Blog",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          tabBarLabel: "Gallery",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="achievement"
        options={{
          tabBarLabel: "Achievement",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ribbon-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="fund"
        options={{
          tabBarLabel: "Fund",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" color={color} size={size} />
          ),
          href: null,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          tabBarLabel: "Assistant",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="setting"
        options={{
          tabBarLabel: "Setting",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
          href: null,
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
