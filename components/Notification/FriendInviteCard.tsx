import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type Invitee = {
  id: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  createdAt?: string;
};

type FriendInviteCardProps = {
  friend: Invitee;
  onAccept?: () => Promise<void> | void;
  onReject?: () => Promise<void> | void;
};

const formatDate = (value?: string) => {
  if (!value) return "";

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
      return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    }

    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  } catch (error) {
    console.error("[FriendInviteCard] formatDate error", error);
    return "";
  }
};

const FriendInviteCard: React.FC<FriendInviteCardProps> = ({
  friend,
  onAccept,
  onReject,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const initials = useMemo(() => {
    const first = friend.firstName?.trim().charAt(0) ?? "";
    const last = friend.lastName?.trim().charAt(0) ?? "";
    const combined = `${first}${last}`.toUpperCase();
    if (combined.length > 0) return combined;
    return friend.id.slice(0, 2).toUpperCase();
  }, [friend.firstName, friend.id, friend.lastName]);

  const displayName = useMemo(() => {
    const first = friend.firstName?.trim() ?? "";
    const last = friend.lastName?.trim() ?? "";
    const full = `${first} ${last}`.trim();
    if (full.length > 0) return full;
    return `Người dùng ${friend.id.slice(0, 6)}...`;
  }, [friend.firstName, friend.id, friend.lastName]);

  const locationLabel = useMemo(() => {
    return friend.city?.trim() ?? "";
  }, [friend.city]);

  const createdLabel = useMemo(
    () => formatDate(friend.createdAt),
    [friend.createdAt]
  );

  const runAction = useCallback(
    async (
      action: (() => Promise<void> | void) | undefined,
      setLoading: (state: boolean) => void
    ) => {
      if (!action) return;
      setLoading(true);
      try {
        await action();
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleAcceptPress = useCallback(() => {
    void runAction(onAccept, setIsAccepting);
  }, [onAccept, runAction]);

  const handleRejectPress = useCallback(() => {
    void runAction(onReject, setIsRejecting);
  }, [onReject, runAction]);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons
              color={Colors.GREEN}
              name="person-add-outline"
              size={14}
            />
            <Text style={styles.metaText}>Đã gửi lời mời kết bạn cho bạn</Text>
          </View>
          {locationLabel ? (
            <View style={styles.metaRow}>
              <Ionicons color={Colors.GRAY} name="location-outline" size={14} />
              <Text style={styles.metaText}>{locationLabel}</Text>
            </View>
          ) : null}
          {createdLabel ? (
            <Text style={styles.timestamp}>Gửi lúc: {createdLabel}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleAcceptPress}
          style={[styles.button, styles.acceptButton]}
          disabled={isAccepting || isRejecting}
        >
          {isAccepting ? (
            <ActivityIndicator color={Colors.WHITE} size="small" />
          ) : (
            <Text style={styles.acceptText}>Chấp nhận</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRejectPress}
          style={[styles.button, styles.rejectButton]}
          disabled={isRejecting || isAccepting}
        >
          {isRejecting ? (
            <ActivityIndicator color={Colors.WHITE} size="small" />
          ) : (
            <Text style={styles.rejectText}>Từ chối</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FriendInviteCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0EA5E9",
  },
  avatarText: {
    fontSize: 18,
    fontFamily: "inter-bold",
    color: Colors.WHITE,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButton: {
    backgroundColor: Colors.GREEN,
  },
  rejectButton: {
    backgroundColor: Colors.RED,
  },
  acceptText: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
  rejectText: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
});
