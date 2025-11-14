import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { EventArg } from "@react-navigation/native";

const TabLayout = () => {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarActiveTintColor: Colors.GREEN,
        tabBarActiveBackgroundColor: "#F0FDFA",
        tabBarLabelStyle: { fontFamily: "inter-medium", fontSize: 7 },
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
        listeners={({ navigation }) => ({
          tabPress: (e: EventArg<"tabPress", true>) => {
            const state = navigation.getState();
            if (state.routes[state.index].name === "dashboard") {
              router.setParams({ scrollToTop: Date.now().toString() } as any);
            }
          },
        })}
      />
      <Tabs.Screen
        name="plan"
        options={{
          tabBarLabel: "Plans",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e: EventArg<"tabPress", true>) => {
            const state = navigation.getState();
            if (state.routes[state.index].name === "plan") {
              router.setParams({ scrollToTop: Date.now().toString() } as any);
            }
          },
        })}
      />
      <Tabs.Screen
        name="friend"
        options={{
          tabBarLabel: "Friend",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e: EventArg<"tabPress", true>) => {
            const state = navigation.getState();
            if (state.routes[state.index].name === "friend") {
              router.setParams({ scrollToTop: Date.now().toString() } as any);
            }
          },
        })}
      />
      <Tabs.Screen
        name="notification"
        options={{
          tabBarLabel: "Notification",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" color={color} size={size} />
          ),
          href: null,
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
        listeners={({ navigation }) => ({
          tabPress: (e: EventArg<"tabPress", true>) => {
            const state = navigation.getState();
            if (state.routes[state.index].name === "blog") {
              router.setParams({ scrollToTop: Date.now().toString() } as any);
            }
          },
        })}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          tabBarLabel: "Gallery",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images-outline" color={color} size={size} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e: EventArg<"tabPress", true>) => {
            const state = navigation.getState();
            if (state.routes[state.index].name === "gallery") {
              router.setParams({ scrollToTop: Date.now().toString() } as any);
            }
          },
        })}
      />
      <Tabs.Screen
        name="achievement"
        options={{
          tabBarLabel: "Achievement",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ribbon-outline" color={color} size={size} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e: EventArg<"tabPress", true>) => {
            const state = navigation.getState();
            if (state.routes[state.index].name === "achievement") {
              router.setParams({ scrollToTop: Date.now().toString() } as any);
            }
          },
        })}
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
        listeners={({ navigation }) => ({
          tabPress: (e: EventArg<"tabPress", true>) => {
            const state = navigation.getState();
            if (state.routes[state.index].name === "assistant") {
              router.setParams({ scrollToTop: Date.now().toString() } as any);
            }
          },
        })}
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
      <Tabs.Screen
        name="premium"
        options={{
          tabBarLabel: "Premium",
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
