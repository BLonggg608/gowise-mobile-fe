import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

export type ItineraryEntry = {
  id: string;
  dayNumber: number;
  date?: string;
  title?: string;
  summary?: string;
  activities: string[];
};

type ItineraryCardProps = {
  containerStyle?: StyleProp<ViewStyle>;
  daysCount: number;
  items: ItineraryEntry[];
  errorMessage?: string | null;
  isLoading: boolean;
};

const ItineraryCard: React.FC<ItineraryCardProps> = ({
  containerStyle,
  daysCount,
  items,
  errorMessage,
  isLoading,
}) => {
  return (
    <View style={[styles.sectionCard, containerStyle]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionIcon}>
            <Ionicons color={Colors.GREEN} name="calendar-outline" size={18} />
          </View>
          <Text style={styles.sectionTitle}>Your Travel Itinerary</Text>
        </View>
        <Text style={styles.sectionMeta}>
          {daysCount} day{daysCount !== 1 ? "s" : ""}
        </Text>
      </View>

      {items.length > 0 ? (
        items.map((item) => (
          <View key={item.id} style={styles.itineraryBlock}>
            <View style={styles.itineraryHeaderRow}>
              <Text style={styles.itineraryDayLabel}>Day {item.dayNumber}</Text>
              {item.date ? (
                <Text style={styles.itineraryDateText}>{item.date}</Text>
              ) : null}
            </View>
            {item.title ? (
              <Text style={styles.itineraryTitle}>{item.title}</Text>
            ) : null}
            {item.summary ? (
              <Text style={styles.itinerarySummary}>{item.summary}</Text>
            ) : null}
            {item.activities.length > 0 ? (
              item.activities.map((activity, index) => (
                <Text
                  key={`${item.id}-activity-${index}`}
                  style={styles.itineraryActivity}
                >
                  • {activity}
                </Text>
              ))
            ) : (
              <Text style={styles.itinerarySummary}>
                No detailed activities available.
              </Text>
            )}
          </View>
        ))
      ) : errorMessage ? (
        <View style={styles.emptyInnerState}>
          <Ionicons color={Colors.GRAY} name="alert-circle-outline" size={28} />
          <Text style={styles.emptyInnerTitle}>Unable to create itinerary</Text>
          <Text style={styles.emptyInnerSubtitle}>{errorMessage}</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.emptyInnerState}>
          <ActivityIndicator color={Colors.GREEN} size="small" />
          <Text style={styles.emptyInnerSubtitle}>Loading itinerary...</Text>
        </View>
      ) : (
        <View style={styles.emptyInnerState}>
          <Ionicons color={Colors.GRAY} name="calendar-outline" size={28} />
          <Text style={styles.emptyInnerTitle}>No itinerary data</Text>
          <Text style={styles.emptyInnerSubtitle}>
            We could not find any itinerary details for this plan.
          </Text>
        </View>
      )}
    </View>
  );
};

export default ItineraryCard;

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0F2F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  sectionMeta: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GREEN,
  },
  itineraryBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
  },
  itineraryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itineraryDayLabel: {
    fontSize: 14,
    fontFamily: "inter-bold",
    color: Colors.GREEN,
  },
  itineraryDateText: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  itineraryTitle: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  itinerarySummary: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  itineraryActivity: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
  },
  emptyInnerState: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyInnerTitle: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  emptyInnerSubtitle: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "center",
  },
});
