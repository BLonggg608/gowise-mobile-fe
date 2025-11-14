import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const statusBarHeight = Constants.statusBarHeight;
const SCREEN_WIDTH = Dimensions.get("window").width;

export type SliderMenuProps = {
  open: boolean;
  sliderAnim: Animated.Value;
  chats: { id: string; title: string; subtitle?: string }[];
  selectedChatId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

const SliderMenu = ({
  open,
  sliderAnim,
  chats,
  selectedChatId,
  onSelect,
  onClose,
}: SliderMenuProps) => {
  const sliderWidth = sliderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH * 0.7],
  });

  return (
    <>
      {open && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
      )}
      <Animated.View style={[styles.slider, { width: sliderWidth }]}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderTitle}>Chọn cuộc trò chuyện</Text>
          {/* <TouchableOpacity onPress={onClose} style={styles.sliderCloseBtn}>
            <Ionicons name="close" size={22} color={Colors.GRAY} />
          </TouchableOpacity> */}
        </View>
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.sliderItem,
                selectedChatId === item.id && styles.sliderItemActive,
              ]}
              onPress={() => {
                onSelect(item.id);
                onClose();
              }}
            >
              <Text style={styles.sliderItemTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.sliderItemSubtitle}>{item.subtitle}</Text>
              )}
            </TouchableOpacity>
          )}
        />
      </Animated.View>
    </>
  );
};

export default SliderMenu;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.18)",
    zIndex: 1,
  },
  slider: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.WHITE,
    zIndex: 2,
    elevation: 4,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: statusBarHeight + 10,
    paddingBottom: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  sliderTitle: {
    fontSize: 18,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  sliderCloseBtn: {
    padding: 4,
    marginLeft: 8,
  },
  sliderItem: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  sliderItemActive: {
    backgroundColor: "#f8f9fa",
  },
  sliderItemTitle: {
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  sliderItemSubtitle: {
    fontSize: 13,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    marginTop: 2,
  },
});
