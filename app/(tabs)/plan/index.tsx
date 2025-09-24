import PlanCard from "@/components/Plan/PlanCard";
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
const initialPlans = [
  {
    id: "1",
    title: "Tokyo Adventure",
    subtitle: "Japan • 7 days",
    status: "Active",
    progress: 0.85,
    image: require("@/assets/images/PlanImage/1.jpg"),
  },
  {
    id: "2",
    title: "European Explorer",
    subtitle: "Europe • 14 days",
    status: "Draft",
    progress: 0.6,
    image: require("@/assets/images/PlanImage/2.jpg"),
  },
  {
    id: "3",
    title: "Bali Retreat",
    subtitle: "Indonesia • 10 days",
    status: "Completed",
    progress: 1,
    image: require("@/assets/images/PlanImage/3.jpg"),
  },
  {
    id: "4",
    title: "New Zealand Highlightssdafasfasdfasdfasfasfsafasfadfasasfasdfsafas",
    subtitle: "New Zealand • 12 days",
    status: "Draft",
    progress: 0.4,
    image: require("@/assets/images/PlanImage/4.jpg"),
  },
];

const planStatusColors: { [key: string]: string } = {
  Active: Colors.LIGHT_GREEN,
  Draft: Colors.YELLOW,
  Completed: Colors.GREEN,
};

const Plan = () => {
  const router = useRouter();
  const [plans, setPlans] = React.useState(initialPlans);

  // Example API call function
  // const fetchPlans = async () => {
  //   const response = await fetch('API_URL');
  //   const data = await response.json();
  //   setPlans(data);
  // };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Plans</Text>
        <View style={styles.headerIcons}>
          {/* <TouchableOpacity>
            <Ionicons
              name="search"
              size={22}
              color="#333"
              style={{ marginRight: 12 }}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="filter" size={22} color="#333" />
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.headerActionIcon}>
            <Ionicons name="search-outline" size={22} color={Colors.BLACK} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionIcon}>
            <Ionicons name="filter-outline" size={22} color={Colors.BLACK} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Plans List */}
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlanCard plan={item} planStatusColors={planStatusColors} />
        )}
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

export default Plan;

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
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerActionIcon: {
    borderRadius: 12,
    padding: 5,
    backgroundColor: "#9c9c9c1e",
    marginLeft: 4,
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
