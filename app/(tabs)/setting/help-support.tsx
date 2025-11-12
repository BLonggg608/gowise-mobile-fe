import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const statusBarHeight = Constants.statusBarHeight;

// Dummy data cho các mục Help & Support, có thể thay bằng API sau này
const helpOptions = [
  {
    id: "getting-started",
    icon: "book-outline",
    title: "Bắt đầu sử dụng",
    desc: "Tìm hiểu cách sử dụng Gowise cơ bản",
    onPress: () => {},
  },
  {
    id: "faqs",
    icon: "help-circle-outline",
    title: "Câu hỏi thường gặp",
    desc: "Tìm câu trả lời cho các thắc mắc phổ biến",
    onPress: () => {},
  },
  {
    id: "contact-support",
    icon: "chatbubble-ellipses-outline",
    title: "Liên hệ hỗ trợ",
    desc: "Nhận trợ giúp từ đội ngũ hỗ trợ",
    onPress: () => {},
  },
  {
    id: "feature-requests",
    icon: "add-circle-outline",
    title: "Đề xuất tính năng",
    desc: "Gửi ý tưởng, góp ý mới",
    onPress: () => {},
  },
];

// Main Help & Support screen
const HelpSupport = () => {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC", }}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackBtn}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hỗ trợ & Trợ giúp</Text>
      </View>

      {/* Danh sách các mục hỗ trợ */}
      <ScrollView
        contentContainerStyle={styles.card}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridRow}>
          {helpOptions.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={styles.optionBox}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              {/* Icon */}
              <Ionicons
                name={item.icon as any}
                size={28}
                color={Colors.GREEN}
                style={{ marginBottom: 10 }}
              />
              {/* Tiêu đề */}
              <Text style={styles.optionTitle}>{item.title}</Text>
              {/* Mô tả */}
              <Text style={styles.optionDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default HelpSupport;

// Styles cho màn Help & Support
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    // alignItems: "center",
    // justifyContent: "space-between",
    paddingTop: statusBarHeight + 12,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#9c9c9c1e",
  },
  headerTitle: {
    marginLeft: 12,
    fontSize: 22,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  card: {
    borderRadius: 16,
    margin: 18,
    shadowColor: Colors.BLACK,
    flexGrow: 1,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 4,
  },
  optionBox: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    width: "48%",
    marginBottom: 12,
    paddingVertical: 22,
    paddingHorizontal: 16,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginBottom: 4,
    textAlign: "left",
  },
  optionDesc: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "left",
  },
});
