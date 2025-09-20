import { Colors } from "@/constant/Colors";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type PlansType = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  progress: number;
  image: any;
};

const PlanCard = ({
  plan,
  planStatusColors,
}: {
  plan: PlansType;
  planStatusColors: { [key: string]: string };
}) => {
  return (
    <TouchableOpacity style={styles.card}>
      {/* Plan Image */}
      <Image source={plan.image} style={styles.cardImage} />

      {/* Plan Content */}
      <View style={styles.cardContent}>
        {/* Plan Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
            {plan.title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: planStatusColors[plan.status] },
            ]}
          >
            <Text style={styles.statusText}>{plan.status}</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>{plan.subtitle}</Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBar, { width: `${plan.progress * 100}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(plan.progress * 100)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default PlanCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 14,
    marginBottom: 18,
    overflow: "hidden",
    elevation: 2,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    flex: 1,
    maxWidth: "70%",
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 8,
    alignSelf: "flex-start",
  },
  statusText: {
    color: Colors.WHITE,
    fontSize: 12,
    fontFamily: "inter-regular",
  },
  cardSubtitle: {
    color: Colors.GRAY,
    fontSize: 14,
    fontFamily: "inter-regular",
    marginTop: 2,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    marginTop: 6,
    marginBottom: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.GREEN,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.GRAY,
    alignSelf: "flex-end",
    marginTop: 2,
  },
});
