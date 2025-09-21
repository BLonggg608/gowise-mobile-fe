import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FundDetailsModal, { ContributorType } from "./FundDetailsModal";

export type FundType = {
  id: string;
  name: string;
  contributors: number;
  raised: number;
  target: number;
  progress: number;
  date: string;
};

// Danh sách mẫu contributors, sắp xếp theo thời gian hoạt động (cũ nhất lên đầu)
const dummyContributors: ContributorType[] = [
  {
    id: "1",
    name: "Mike Chen",
    amount: 900,
    type: "deposit",
    date: "1 week ago",
  },
  {
    id: "2",
    name: "Emma Rodriguez",
    amount: 900,
    type: "deposit",
    date: "1 week ago",
  },
  {
    id: "3",
    name: "Sarah Johnson",
    amount: 600,
    type: "deposit",
    date: "3 days ago",
  },
  {
    id: "4",
    name: "John Doe",
    amount: 800,
    type: "deposit",
    date: "2 days ago",
  },
  {
    id: "5",
    name: "John Doe",
    amount: 200,
    type: "withdraw",
    date: "1 day ago",
  },
  {
    id: "6",
    name: "John Doe",
    amount: 200,
    type: "deposit",
    date: "1 day ago",
  },
];

const FundCard = ({ fund }: { fund: FundType }) => {
  const [modalVisible, setModalVisible] = useState(false);

  // In real app, pass contributors/history from API using fund ID
  const contributors = dummyContributors;
  const totalRaised = fund.raised;
  const totalContributors = fund.contributors;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="cash-outline" size={22} color={Colors.GREEN} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {fund.name}
          </Text>
          <Text style={styles.subTitle}>
            {fund.contributors} contributors • {fund.date}
          </Text>
        </View>
      </View>
      {/* Progress */}
      <Text style={styles.progressLabel}>Progress</Text>
      <View style={styles.progressBarWrap}>
        <View
          style={[styles.progressBar, { width: `${fund.progress * 100}%` }]}
        />
      </View>
      <Text style={styles.progressPercent}>
        {Math.round(fund.progress * 100)}% funded
      </Text>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons
            name="card-outline"
            size={16}
            color={Colors.GREEN}
            style={styles.statIcon}
          />
          <Text style={styles.statValue}>
            {fund.raised.toLocaleString("en-US")}
          </Text>
          <Text style={styles.statLabel}>Raised</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons
            name="wallet-outline"
            size={16}
            color={Colors.GREEN}
            style={styles.statIcon}
          />
          <Text style={styles.statValue}>
            {fund.target.toLocaleString("en-US")}
          </Text>
          <Text style={styles.statLabel}>Target</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons
            name="people-outline"
            size={16}
            color={Colors.GREEN}
            style={styles.statIcon}
          />
          <Text style={styles.statValue}>{fund.contributors}</Text>
          <Text style={styles.statLabel}>Contributors</Text>
        </View>
      </View>
      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.contributeBtn}>
          <Text style={styles.contributeText}>+ Contribute</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.detailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
      {/* Fund Details Modal */}
      <FundDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        fundName={fund.name}
        contributors={contributors}
        totalRaised={totalRaised}
        totalContributors={totalContributors}
      />
    </View>
  );
};

export default FundCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    marginBottom: 18,
    padding: 16,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  iconWrap: {
    backgroundColor: "#eafaf3",
    borderRadius: 12,
    padding: 6,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  subTitle: {
    fontSize: 12,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    marginTop: 2,
  },
  progressLabel: {
    fontSize: 13,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    marginTop: 8,
    marginBottom: 2,
  },
  progressBarWrap: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    marginBottom: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.GREEN,
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 11,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    marginTop: 2,
    marginBottom: 8,
    textAlign: "right",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statIcon: {
    borderRadius: 12,
    backgroundColor: "#eafaf3",
    padding: 4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  contributeBtn: {
    backgroundColor: Colors.GREEN,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  contributeText: {
    color: Colors.WHITE,
    fontSize: 15,
    fontFamily: "inter-medium",
  },
  detailsBtn: {
    backgroundColor: "#eafaf3",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  detailsText: {
    color: Colors.GREEN,
    fontSize: 15,
    fontFamily: "inter-medium",
  },
});
