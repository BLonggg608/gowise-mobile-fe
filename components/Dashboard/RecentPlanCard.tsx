import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type RecentPlanCardProps = {
  title: string;
  location: string;
  durationInDays: number;
  status: string;
  statusColor?: string;
  onPress: () => void;
};

const RecentPlanCard = ({
  title,
  location,
  durationInDays,
  status,
  statusColor,
  onPress,
}: RecentPlanCardProps) => {
  const durationText =
    durationInDays > 0 ? `${durationInDays} ngày` : "Không rõ thời gian";
  const badgeColor = statusColor || Colors.GRAY;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={styles.card}
    >
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      <View style={styles.locationRow}>
        <Ionicons color={Colors.GREEN} name="location-outline" size={16} />
        <Text numberOfLines={1} style={styles.locationText}>
          {location}
        </Text>
        <Text style={styles.durationText}> • {durationText}</Text>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
        <Text numberOfLines={1} style={styles.statusText}>
          {status}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default RecentPlanCard;

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginLeft: 18,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    // flex: 1,
  },
  durationText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
});
