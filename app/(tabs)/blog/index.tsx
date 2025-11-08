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

// Dummy data for now, replace with API call in future
const initialBlogs = [
  {
    id: "1",
    title: "Ultimate Guide to Tokyo in 7 Days",
    subtitle:
      "Discover the best of Tokyo with our comprehensive guide covering must-visit places, local cuisine, and hidden gems.",
    image: require("@/assets/images/PlanImage/1.jpg"),
    readTime: "8 min read",
    date: "2 days ago",
    likes: 124,
    views: 1543,
  },
  {
    id: "2",
    title: "Budget Travel: Europe on $50 a Day",
    subtitle:
      "Learn how to explore Europe without breaking the bank with these practical tips and budget-friendly recommendations.",
    image: require("@/assets/images/PlanImage/2.jpg"),
    readTime: "6 min read",
    date: "5 days ago",
    likes: 89,
    views: 1543,
  },
  {
    id: "3",
    title: "Bali Hidden Temples You Must Visit",
    subtitle:
      "Explore the spiritual side of Bali with these lesser-known temples that offer tranquility and stunning architecture.",
    image: require("@/assets/images/PlanImage/3.jpg"),
    readTime: "5 min read",
    date: "1 week ago",
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
          <Text style={styles.headerTitle}>Travel Blog</Text>
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
        Discover amazing travel stories and tips
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
