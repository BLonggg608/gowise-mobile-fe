import BlogCard from "@/components/Blog/BlogCard";
import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { RelativePathString, useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const statusBarHeight = Constants.statusBarHeight;

// Dữ liệu mẫu, sẽ thay bằng API sau
const initialBlogs = [
  {
    id: "1",
    title: "Hướng dẫn du lịch Tokyo 7 ngày",
    subtitle:
      "Khám phá Tokyo với hướng dẫn chi tiết về các điểm đến nổi bật, ẩm thực địa phương và những điều thú vị ít ai biết.",
    image: require("@/assets/images/PlanImage/1.jpg"),
    date: "2 ngày trước",
    likes: 124,
    views: 1543,
  },
  {
    id: "2",
    title: "Du lịch Châu Âu chỉ với 1.200.000đ/ngày",
    subtitle:
      "Khám phá cách vi vu Châu Âu tiết kiệm với các mẹo thực tế và gợi ý hợp túi tiền.",
    image: require("@/assets/images/PlanImage/2.jpg"),
    date: "5 ngày trước",
    likes: 89,
    views: 1543,
  },
  {
    id: "3",
    title: "Những ngôi đền bí ẩn ở Bali",
    subtitle:
      "Khám phá nét tâm linh của Bali qua các ngôi đền ít người biết đến, yên bình và kiến trúc tuyệt đẹp.",
    image: require("@/assets/images/PlanImage/3.jpg"),
    date: "1 tuần trước",
    likes: 67,
    views: 1543,
  },
];

const Blog = () => {
  const router = useRouter();
  // const [blogs, setBlogs] = useState(initialBlogs);

  // Example API call function
  // const fetchBlogs = async () => {
  //   const response = await fetch('API_URL');
  //   const data = await response.json();
  //   setBlogs(data);
  // };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Blog Du Lịch</Text>
        </View>
        {/* <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerActionIcon}>
            <Ionicons name="search-outline" size={22} color="#222" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionIcon}>
            <Ionicons name="filter-outline" size={22} color="#222" />
          </TouchableOpacity>
        </View> */}
      </View>

      <Text style={styles.headerSubtitle}>
        Khám phá những câu chuyện và mẹo du lịch tuyệt vời
      </Text>

      {/* Blogs List */}
      <FlatList
        data={initialBlogs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BlogCard blog={item} />}
        contentContainerStyle={{
          paddingBottom: 100,
          paddingHorizontal: 18,
          marginTop: 18,
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Buttons */}
      <View style={{ position: "absolute", right: 10, bottom: 10 }}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/setting" as RelativePathString)}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color={Colors.WHITE} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color={Colors.WHITE} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Blog;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: statusBarHeight + 10,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  headerSubtitle: {
    paddingHorizontal: 18,
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginTop: 18,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  // headerActionIcon: {
  //   borderRadius: 12,
  //   padding: 5,
  //   backgroundColor: "#9c9c9c1e",
  //   marginLeft: 4,
  // },
  fab: {
    backgroundColor: Colors.GREEN,
    borderRadius: 28,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: Colors.GREEN,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 8,
  },
});
