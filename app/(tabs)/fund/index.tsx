import FundCard, { FundType } from "@/components/Fund/FundCard";
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
const initialFunds: FundType[] = [
  {
    id: "1",
    name: "Tokyo Adventure",
    contributors: 4,
    raised: 3200,
    target: 4500,
    progress: 0.71,
    date: "1 day ago",
  },
  {
    id: "2",
    name: "European Explorer",
    contributors: 6,
    raised: 2800,
    target: 5500,
    progress: 0.51,
    date: "1 day ago",
  },
  {
    id: "3",
    name: "Bali Retreat",
    contributors: 3,
    raised: 2200,
    target: 2200,
    progress: 1,
    date: "1 day ago",
  },
];

const Fund = () => {
  const router = useRouter();
  // Example API call function
  // const [funds, setFunds] = React.useState(initialFunds);
  // const fetchFunds = async () => {
  //   const response = await fetch('API_URL');
  //   const data = await response.json();
  //   setFunds(data);
  // };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Common Fund</Text>
        <TouchableOpacity style={styles.headerActionBtn}>
          <Ionicons name="add" size={20} color={Colors.WHITE} />
          <Text style={styles.headerActionText}>Create Fund</Text>
        </TouchableOpacity>
      </View>

      {/* Fund List */}
      <FlatList
        data={initialFunds}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FundCard fund={item} />}
        contentContainerStyle={{
          paddingBottom: 100,
          paddingHorizontal: 18,
          marginTop: 18,
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <View style={{ position: "absolute", right: 10, bottom: 10 }}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/setting" as RelativePathString)}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color={Colors.WHITE} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Fund;

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
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  headerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.GREEN,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  headerActionText: {
    color: Colors.WHITE,
    fontSize: 15,
    fontFamily: "inter-medium",
    marginLeft: 6,
  },
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
