import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

export type IconDefinition =
  | { type: "ion"; name: keyof typeof Ionicons.glyphMap; color: string }
  | { type: "emoji"; value: string };

export type AchievementCardProps = {
  title: string;
  description: string;
  points: number;
  maxProgress: number;
  progress: number;
  icon: IconDefinition;
  isUnlocked: boolean;
  unlockedDate?: string;
};

const AchievementCard: React.FC<AchievementCardProps> = ({
  title,
  description,
  points,
  maxProgress,
  progress,
  icon,
  isUnlocked,
  unlockedDate,
}) => {
  const progressPercent = useMemo(() => {
    if (maxProgress <= 0) return 0;
    return Math.min(Math.round((progress / maxProgress) * 100), 100);
  }, [maxProgress, progress]);

  return (
    <View style={[styles.card, isUnlocked && styles.cardUnlocked]}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrapper}>
          {icon.type === "emoji" ? (
            <Text style={styles.emojiIcon}>{icon.value}</Text>
          ) : (
            <Ionicons color={icon.color} name={icon.name} size={22} />
          )}
        </View>

        {isUnlocked ? (
          <View style={styles.badge}>
            <Ionicons color={Colors.WHITE} name="checkmark-circle" size={16} />
            <Text style={styles.badgeText}>Đã mở khóa</Text>
          </View>
        ) : (
          <View style={styles.badgeLocked}>
            <Ionicons color={Colors.GRAY} name="lock-closed" size={14} />
            <Text style={styles.badgeLockedText}>Chưa mở</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>

      <View style={styles.metaRow}>
        <View style={styles.pointsPill}>
          <Ionicons color={Colors.WHITE} name="sparkles" size={14} />
          <Text style={styles.pointsText}>{points} điểm</Text>
        </View>
        {unlockedDate ? (
          <Text style={styles.unlockedText}>
            Mở khóa {new Date(unlockedDate).toLocaleDateString()}
          </Text>
        ) : null}
      </View>

      <View style={styles.progressWrapper}>
        <View style={styles.progressBarBackground}>
          <View
            style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {progress}/{maxProgress}
        </Text>
      </View>
    </View>
  );
};

export default memo(AchievementCard);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.WHITE,
    borderRadius: 22,
    padding: 18,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardUnlocked: {
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.35)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(15, 118, 110, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiIcon: {
    fontSize: 24,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.GREEN,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
  badgeLocked: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(148, 163, 184, 0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeLockedText: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pointsPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.YELLOW + "CC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pointsText: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
  unlockedText: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  progressWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
    marginRight: 12,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: Colors.GREEN,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
});
