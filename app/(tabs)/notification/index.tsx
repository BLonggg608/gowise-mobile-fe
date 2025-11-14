import FriendInviteCard, {
  Invitee,
} from "@/components/Notification/FriendInviteCard";
import { Colors } from "@/constant/Colors";
import { getSecureData } from "@/utils/storage";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "toastify-react-native";

type FriendRelation = {
  userId: string;
  friendId: string;
  status: boolean;
  isSender: boolean;
  createdAt?: string;
};

type PendingRequest = {
  friend: Invitee;
  relation: FriendRelation;
  peerId: string;
};

const statusBarHeight = Constants.statusBarHeight;

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";

  if (!domain) {
    console.error("[FriendInvitesScreen] Missing BE_DOMAIN configuration");
    return null;
  }

  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return port
    ? `${trimmedDomain}:${port}${normalizedPath}`
    : `${trimmedDomain}${normalizedPath}`;
};

const NotificationScreen = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchFriendDetails = useCallback(
    async (targetUserId: string, token: string): Promise<Invitee | null> => {
      const endpoint = buildApiUrl(`/users/${targetUserId}`);
      if (!endpoint) return null;

      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const reason = await response.text();
          console.warn(
            `[FriendInvitesScreen] Failed to fetch user ${targetUserId}:`,
            reason
          );
          return null;
        }

        const payload = await response.json();
        const data = payload?.data ?? payload;

        return {
          id: String(data?.id ?? targetUserId),
          firstName: data?.firstName ?? "",
          lastName: data?.lastName ?? "",
          city: data?.city ?? undefined,
          createdAt: data?.createdAt ?? undefined,
        } satisfies Invitee;
      } catch (error) {
        console.error(
          `[FriendInvitesScreen] Error fetching ${targetUserId}`,
          error
        );
        return null;
      }
    },
    []
  );

  const fetchPendingRequests = useCallback(
    async ({ initial = false }: { initial?: boolean } = {}) => {
      if (initial) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        setErrorMessage(null);
        const token = await getSecureData("accessToken");
        const userId = await getUserIdFromToken();

        if (!token || !userId) {
          setRequests([]);
          setErrorMessage("Không thể xác định thông tin người dùng");
          return;
        }

        const endpoint = buildApiUrl("/users/friends/pending");
        if (!endpoint) {
          setRequests([]);
          setErrorMessage("Thiếu cấu hình máy chủ");
          return;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        });

        if (!response.ok) {
          const reason = await response.text();
          throw new Error(
            reason || `Request failed with status ${response.status}`
          );
        }

        const payload = await response.json();
        const relations: FriendRelation[] = Array.isArray(payload?.data)
          ? payload.data
          : [];

        const resolvePeerId = (relation: FriendRelation): string | null => {
          if (relation.userId === userId) return relation.friendId;
          if (relation.friendId === userId) return relation.userId;
          return relation.friendId || relation.userId || null;
        };

        const incomingRelations = relations.filter(
          (relation) => !relation.isSender
        );

        const detailedRequests = await Promise.all(
          incomingRelations.map(async (relation) => {
            const peerId = resolvePeerId(relation);
            if (!peerId) return null;
            const friend = await fetchFriendDetails(peerId, token as string);
            if (!friend) return null;
            return {
              friend,
              relation,
              peerId,
            } satisfies PendingRequest;
          })
        );

        const validRequests = detailedRequests.filter(
          (item): item is PendingRequest => Boolean(item)
        );

        setRequests(validRequests);
      } catch (error) {
        console.error("[FriendInvitesScreen] fetchPendingRequests", error);
        setRequests([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể kết nối đến máy chủ"
        );
        Toast.show({
          type: "error",
          text1: "Không thể tải lời mời",
          text2:
            error instanceof Error
              ? error.message
              : "Đã xảy ra lỗi không xác định.",
        });
      } finally {
        if (initial) {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [fetchFriendDetails]
  );

  useFocusEffect(
    useCallback(() => {
      fetchPendingRequests({ initial: true });
    }, [fetchPendingRequests])
  );

  const handleRefresh = useCallback(() => {
    fetchPendingRequests({ initial: false });
  }, [fetchPendingRequests]);

  const acceptRequest = useCallback(async (request: PendingRequest) => {
    try {
      const token = await getSecureData("accessToken");
      const userId = await getUserIdFromToken();

      if (!token || !userId) {
        Toast.show({
          type: "error",
          text1: "Thiếu thông tin",
          text2: "Không thể xác định người dùng hiện tại.",
        });
        return;
      }

      const endpoint = buildApiUrl("/users/friends/accept");
      if (!endpoint) {
        Toast.show({
          type: "error",
          text1: "Thiếu cấu hình",
          text2: "Không xác định được máy chủ.",
        });
        return;
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          friend_id: request.peerId,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const reason =
          payload?.message || `Request failed with status ${response.status}`;
        throw new Error(reason);
      }

      setRequests((prev) =>
        prev.filter((item) => item.peerId !== request.peerId)
      );
    } catch (error) {
      console.error("[FriendInvitesScreen] acceptRequest", error);
      Toast.show({
        type: "error",
        text1: "Không thể chấp nhận",
        text2:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi không xác định.",
      });
    }
  }, []);

  const rejectRequest = useCallback(async (request: PendingRequest) => {
    try {
      const token = await getSecureData("accessToken");
      const userId = await getUserIdFromToken();

      if (!token || !userId) {
        Toast.show({
          type: "error",
          text1: "Thiếu thông tin",
          text2: "Không thể xác định người dùng hiện tại.",
        });
        return;
      }

      const endpoint = buildApiUrl("/users/friends");
      if (!endpoint) {
        Toast.show({
          type: "error",
          text1: "Thiếu cấu hình",
          text2: "Không xác định được máy chủ.",
        });
        return;
      }

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          friend_id: request.peerId,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const reason =
          payload?.message || `Request failed with status ${response.status}`;
        throw new Error(reason);
      }

      setRequests((prev) =>
        prev.filter((item) => item.peerId !== request.peerId)
      );
    } catch (error) {
      console.error("[FriendInvitesScreen] rejectRequest", error);
      Toast.show({
        type: "error",
        text1: "Không thể từ chối",
        text2:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi không xác định.",
      });
    }
  }, []);

  const summaryText = useMemo(() => {
    if (isLoading) {
      return "Đang tải lời mời kết bạn";
    }

    if (requests.length > 0) {
      return `Bạn có ${requests.length} lời mời kết bạn chờ xử lý`;
    }

    return "Không có lời mời kết bạn nào";
  }, [isLoading, requests.length]);

  const renderItem = useCallback(
    ({ item }: { item: PendingRequest }) => (
      <FriendInviteCard
        friend={item.friend}
        onAccept={() => acceptRequest(item)}
        onReject={() => rejectRequest(item)}
      />
    ),
    [acceptRequest, rejectRequest]
  );

  const keyExtractor = useCallback((item: PendingRequest) => item.peerId, []);

  const listEmptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator color={Colors.GREEN} size="large" />
          <Text style={styles.stateText}>Đang tải lời mời kết bạn...</Text>
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons color={Colors.RED} name="alert-circle-outline" size={46} />
          <Text style={styles.errorTitle}>Có lỗi xảy ra</Text>
          <Text style={styles.errorSubtitle}>{errorMessage}</Text>
        </View>
      );
    }

    return (
      <View style={styles.stateContainer}>
        <Ionicons
          color={Colors.GRAY}
          name="notifications-off-outline"
          size={46}
        />
        <Text style={styles.stateTitle}>Không có lời mời kết bạn</Text>
        <Text style={styles.stateText}>
          Khi có lời mời mới, chúng tôi sẽ hiển thị tại đây để bạn xử lý.
        </Text>
      </View>
    );
  }, [errorMessage, isLoading]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackBtn}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <Text style={styles.headerSubtitle}>{summaryText}</Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.GREEN]}
            tintColor={Colors.GREEN}
          />
        }
        ListEmptyComponent={listEmptyComponent}
      />
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: statusBarHeight + 12,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#9c9c9c1e",
  },
  headerTitle: {
    marginLeft: 12,
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    fontSize: 22,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 140,
    paddingTop: 18,
  },
  separator: {
    height: 14,
  },
  stateContainer: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateTitle: {
    fontSize: 16,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
  },
  stateText: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "center",
  },
  errorContainer: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorTitle: {
    fontSize: 15,
    fontFamily: "inter-bold",
    color: Colors.RED,
  },
  errorSubtitle: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.RED,
    textAlign: "center",
  },
});
