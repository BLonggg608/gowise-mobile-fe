import PlanDetailHeader from "@/components/Plan/PlanDetail/PlanDetailHeader";
import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

// Data giả cho màn chi tiết plan, có thể thay bằng API sau này
const dummyPlanDetail = {
  id: "1",
  title: "Tokyo Adventure",
  subtitle: "Japan",
  description:
    "Experience the vibrant culture, cutting-edge technology, and incredible cuisine of Tokyo. From ancient temples to modern skyscrapers, this adventure covers the best of both traditional and contemporary Japan.",
  duration: "7 days",
  budget: 2800,
  created: "1/15/2024",
  activities: 2,
  status: "Active",
  image: require("@/assets/images/PlanImage/1.jpg"),
  itinerary: [
    {
      day: 1,
      date: "2024-03-01",
      title: "Shibuya & Harajuku",
      activities: [
        "Arrive at Narita Airport",
        "Check-in at hotel",
        "Explore Shibuya Crossing",
        "Dinner in Harajuku",
      ],
    },
    {
      day: 2,
      date: "2024-03-02",
      title: "Asakusa & Skytree",
      activities: [
        "Visit Senso-ji Temple",
        "Explore Asakusa district",
        "Traditional sushi lunch",
        "Tokyo Skytree observation",
      ],
    },
    {
      day: 3,
      date: "2024-03-03",
      title: "Central Tokyo",
      activities: [
        "Tsukiji Outer Market",
        "Imperial Palce gardens",
        "Ginza shopping",
        "Kabuki performance",
      ],
    },
    {
      day: 4,
      date: "2024-03-04",
      title: "Nikko",
      activities: [
        "Day trip to Nikko",
        "Toshogu Shrine",
        "Lake Chuzenji",
        "Traditional ryokan dinner",
      ],
    },
    {
      day: 5,
      date: "2024-03-05",
      title: "Shibuya & Roppongi",
      activities: [
        "Meiji Shrine visit",
        "Omotesando shopping",
        "Roppongi nightlife",
        "Karaoke experience",
      ],
    },
  ],
  budgetBreakdown: [
    { label: "Round Trip Airfare", value: 800 },
    { label: "Accommodation", value: 700 },
    { label: "Food & Dining", value: 500 },
    { label: "Local Transportation", value: 200 },
    { label: "Activities & Tours", value: 400 },
    { label: "Shopping & Souvenirs", value: 200 },
  ],
  accommodations: [
    {
      name: "Tokyo Grand Hotel",
      type: "Business hotel",
      rating: 4.5,
      dateRange: "2024-03-01 ~ 2024-03-08",
      price: 700,
    },
  ],
  specialActivities: [
    {
      name: "Sushi Making Class",
      desc: "Learn to make traditional sushi with a master chef",
      duration: "3 hours",
      date: "2024-03-03",
      price: 80,
      type: "Culinary",
    },
    {
      name: "Tokyo Skytree Admission",
      desc: "Visit the tallest structure in Japan",
      duration: "2 hours",
      date: "2024-03-02",
      price: 25,
      type: "Sightseeing",
    },
  ],
};

// Màn chi tiết plan, nhận id từ route params
const PlanDetail = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Lấy id từ route params

  // TODO: Call API lấy chi tiết plan theo id
  // const [plan, setPlan] = React.useState(null);
  // React.useEffect(() => {
  //   fetchPlanDetail(id).then(setPlan);
  // }, [id]);

  // Dùng data giả cho demo
  const plan = dummyPlanDetail;

  return (
    <View style={{ flex: 1 }}>
      {/* Header với nút back và tiêu đề */}
      <PlanDetailHeader title={plan.title} status={plan.status} />

      <ScrollView
        contentContainerStyle={{ padding: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Ảnh và thông tin cơ bản */}
        <View
          style={{
            backgroundColor: Colors.WHITE,
            borderRadius: 16,
            marginBottom: 8,
          }}
        >
          {/* Ảnh plan */}
          <Image
            source={plan.image}
            style={styles.planImage}
            resizeMode="cover"
          />
          {/* Thông tin cơ bản */}
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
            <Text style={styles.planDesc}>{plan.description}</Text>
            <View style={styles.infoGridRow}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>
                  <Ionicons name="time-outline" /> Duration
                </Text>
                <Text style={styles.infoValue}>{plan.duration}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>
                  <Ionicons name="wallet-outline" /> Budget
                </Text>
                <Text style={styles.infoValue}>
                  ${plan.budget.toLocaleString()}
                </Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>
                  <Ionicons name="calendar-outline" /> Created
                </Text>
                <Text style={styles.infoValue}>{plan.created}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>
                  <Ionicons name="list-outline" /> Activities
                </Text>
                <Text style={styles.infoValue}>{plan.activities}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Itinerary */}
        <Text style={styles.sectionTitle}>Itinerary</Text>
        <View style={styles.itineraryBox}>
          {plan.itinerary.map((d) => (
            <View key={d.day}>
              <View style={styles.dayBox}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={styles.dayTitle}>Day {d.day}</Text>
                  <Text style={styles.dayDate}>{d.date}</Text>
                </View>
                <Text style={styles.daySubtitle}>{d.title}</Text>
                {d.activities.map((act, idx) => (
                  <Text key={idx} style={styles.dayActivity}>
                    <Text style={{ color: Colors.GREEN }}>•</Text> {act}
                  </Text>
                ))}
              </View>
              {/* {plan.itinerary.length !== d.day && (
                <View style={styles.seperator}></View>
              )} */}
            </View>
          ))}
        </View>

        {/* Budget Breakdown */}
        <Text style={styles.sectionTitle}>Budget Breakdown</Text>
        <View style={styles.budgetBox}>
          {plan.budgetBreakdown.map((b, idx) => (
            <View key={idx} style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>{b.label}</Text>
              <Text style={styles.budgetValue}>
                ${b.value.toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={styles.seperator}></View>
          <View style={styles.budgetRow}>
            <Text
              style={[
                styles.budgetLabel,
                { fontFamily: "inter-medium", color: Colors.GREEN },
              ]}
            >
              Total Budget
            </Text>
            <Text style={[styles.budgetValue, { color: Colors.GREEN }]}>
              ${plan.budget.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Accommodations */}
        <Text style={styles.sectionTitle}>Accommodations</Text>
        {plan.accommodations.map((a, idx) => (
          <View key={idx} style={styles.accomBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.accomName}>{a.name}</Text>
              <Text style={styles.accomType}>{a.type}</Text>
              <Text style={styles.accomDate}>{a.dateRange}</Text>
            </View>
            <View
              style={{
                flexDirection: "column",
                alignItems: "flex-end",
                justifyContent: "space-between",
              }}
            >
              <Text style={styles.accomRating}>
                <Ionicons name="star" size={14} color={Colors.YELLOW} />{" "}
                {a.rating}
              </Text>
              <Text style={styles.accomPrice}>${a.price.toLocaleString()}</Text>
            </View>
          </View>
        ))}

        {/* Special Activities */}
        <Text style={styles.sectionTitle}>Special Activities</Text>
        <View style={styles.specialBox}>
          {plan.specialActivities.map((s, idx) => (
            <View key={idx} style={styles.activityBox}>
              <Text style={styles.specialName}>{s.name}</Text>
              <Text style={styles.specialDesc}>{s.desc}</Text>
              <Text style={styles.specialDesc}>
                <Ionicons name="time-outline" size={14} color={Colors.GRAY} />{" "}
                {s.duration} • {s.date}
              </Text>
              <View style={styles.seperator}></View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.specialInfo}>{s.type}</Text>
                <Text style={[styles.specialInfo, { color: Colors.GREEN }]}>
                  ${s.price}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default PlanDetail;

// Styles cho màn chi tiết plan, tham khảo từ index.tsx
const styles = StyleSheet.create({
  seperator: {
    marginTop: 4,
    marginBottom: 12,
    height: 1,
    backgroundColor: "#cfcfcfff",
  },
  planImage: {
    width: "100%",
    height: 150,
    // borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: 14,
  },
  planSubtitle: {
    fontSize: 15,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    marginBottom: 10,
  },
  planDesc: {
    fontSize: 14,
    color: Colors.BLACK,
    fontFamily: "inter-regular",
    marginBottom: 20,
  },
  infoGridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 4,
  },
  infoBox: {
    backgroundColor: "#f8fafb",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    width: "48%",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.BLACK,
    fontFamily: "inter-medium",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
    marginBottom: 6,
    marginTop: 16,
  },
  itineraryBox: {
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  dayBox: {
    marginLeft: 6,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.LIGHT_GREEN,
    marginVertical: 10,
  },
  dayTitle: {
    fontSize: 15,
    fontFamily: "inter-medium",
    color: Colors.GREEN,
    backgroundColor: "#e6f4f1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 13,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
  },
  daySubtitle: {
    fontSize: 15,
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    marginBottom: 4,
  },
  dayActivity: {
    fontSize: 14,
    color: Colors.BLACK,
    fontFamily: "inter-regular",
    marginLeft: 8,
  },
  budgetBox: {
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  budgetLabel: {
    fontSize: 14,
    color: Colors.BLACK,
    fontFamily: "inter-regular",
  },
  budgetValue: {
    fontSize: 14,
    color: Colors.BLACK,
    fontFamily: "inter-medium",
  },
  accomBox: {
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
  },
  accomName: {
    fontSize: 15,
    color: Colors.BLACK,
    fontFamily: "inter-medium",
  },
  accomType: {
    fontSize: 13,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
  },
  accomDate: {
    fontSize: 13,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    marginBottom: 2,
  },
  accomRating: {
    fontSize: 14,
    color: Colors.BLACK,
    fontFamily: "inter-regular",
  },
  accomPrice: {
    fontSize: 14,
    color: Colors.GREEN,
    fontFamily: "inter-medium",
  },
  specialBox: {
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 12,
    marginBottom: 8,
  },
  activityBox: {
    backgroundColor: "#f8fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  specialName: {
    fontSize: 15,
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    marginBottom: 4,
  },
  specialDesc: {
    fontSize: 13,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    marginBottom: 4,
  },
  specialInfo: {
    fontSize: 13,
    color: Colors.BLACK,
    fontFamily: "inter-medium",
  },
});
