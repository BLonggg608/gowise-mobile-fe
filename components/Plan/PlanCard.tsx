import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type PlanStatus = "active" | "draft" | "completed";

export type PlanListItem = {
  id: string;
  title: string;
  location: string;
  durationLabel: string;
  budgetLabel: string;
  createdLabel: string;
  status: PlanStatus;
  description?: string;
  durationInDays?: number;
  budgetValue?: number;
  createdValue?: number;
  raw?: Record<string, unknown>;
};

const statusLabels: Record<PlanStatus, string> = {
  active: "Đang hoạt động",
  draft: "Bản nháp",
  completed: "Hoàn thành",
};

type PlanCardProps = {
  plan: PlanListItem;
  statusColors: Record<PlanStatus, string>;
  onPress?: (plan: PlanListItem) => void;
  onEdit?: (plan: PlanListItem) => void;
  onDelete?: (plan: PlanListItem) => void;
  viewMode: "grid" | "list";
};

const PlanCard = ({
  plan,
  statusColors,
  onPress,
  onEdit,
  onDelete,
  viewMode,
}: PlanCardProps) => {
  const statusColor = statusColors[plan.status] ?? Colors.GREEN;
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(plan)}
      style={[
        styles.card,
        viewMode === "list" ? styles.cardList : styles.cardGrid,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerContent}>
          <Text numberOfLines={2} style={styles.title}>
            {plan.title}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusLabels[plan.status]}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Ionicons color={Colors.GRAY} name="location-outline" size={16} />
        <Text numberOfLines={1} style={styles.location}>
          {plan.location}
        </Text>
      </View>

      {plan.description ? (
        <Text numberOfLines={2} style={styles.description}>
          {plan.description}
        </Text>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons color={Colors.GREEN} name="time-outline" size={16} />
          <Text style={styles.statLabel}>{plan.durationLabel}</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons color={Colors.GREEN} name="wallet-outline" size={16} />
          <Text style={styles.statLabel}>{plan.budgetLabel}</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons color={Colors.GREEN} name="calendar-outline" size={16} />
          <Text style={styles.statLabel}>{plan.createdLabel}</Text>
        </View>
      </View>

      {hasActions ? (
        <View style={styles.actionsRow}>
          {onEdit ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onEdit(plan)}
              style={styles.actionButton}
            >
              <Ionicons color={Colors.GREEN} name="create-outline" size={18} />
              <Text style={styles.actionText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          ) : null}
          {onDelete ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onDelete(plan)}
              style={[
                styles.actionButton,
                {
                  marginLeft: 18,
                  backgroundColor: Colors.RED + "20",
                  padding: 4,
                  borderRadius: 8,
                },
              ]}
            >
              <Ionicons color={Colors.RED} name="trash-outline" size={18} />
              <Text style={[styles.actionText, { color: Colors.RED }]}>
                Xóa
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

export default PlanCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    flex: 1,
  },
  cardGrid: {
    marginHorizontal: 6,
  },
  cardList: {
    marginHorizontal: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  statusText: {
    color: Colors.WHITE,
    fontSize: 12,
    fontFamily: "inter-medium",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  location: {
    marginLeft: 6,
    fontSize: 13,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    flex: 1,
  },
  description: {
    fontSize: 13,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  statLabel: {
    marginLeft: 6,
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GREEN,
  },
});
