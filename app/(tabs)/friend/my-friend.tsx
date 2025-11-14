import FriendCard from "@/components/Friend/MyFriend/FriendCard";
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

export type FriendProfile = {
  id: string;
  firstName: string;
  lastName: string;
  isPremium: boolean;
  city?: string;
  createdAt?: string;
  bio?: string;
};

const statusBarHeight = Constants.statusBarHeight;

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";

  if (!domain) {
    console.error("[MyFriendScreen] Missing BE_DOMAIN configuration");
    return null;
  }

  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return port
    ? `${trimmedDomain}:${port}${normalizedPath}`
    : `${trimmedDomain}${normalizedPath}`;
};

const MyFriendScreen = () => {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPendingFriendRequests, setHasPendingFriendRequests] =
    useState(false);

  const fetchFriendDetails = useCallback(
    async (friendId: string, token: string): Promise<FriendProfile | null> => {
      const endpoint = buildApiUrl(`/users/${friendId}`);
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
            `[MyFriendScreen] Failed to fetch user ${friendId}:`,
            reason
          );
          return null;
        }

        const payload = await response.json();
        const data = payload?.data ?? payload ?? {};

        return {
          id: String(data?.id ?? friendId),
          firstName: data?.firstName ?? "",
          lastName: data?.lastName ?? "",
          isPremium: Boolean(data?.isPremium),
          city: data?.city ?? undefined,
          createdAt: data?.createdAt ?? undefined,
          bio: typeof data?.bio === "string" ? data.bio : undefined,
        } satisfies FriendProfile;
      } catch (error) {
        console.error(`[MyFriendScreen] Error fetching ${friendId}`, error);
        return null;
      }
    },
    []
  );

  const fetchFriends = useCallback(
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
          setFriends([]);
          setErrorMessage("Không thể xác định thông tin người dùng");
          return;
        }

        const endpoint = buildApiUrl("/users/friends/accepted");
        if (!endpoint) {
          setFriends([]);
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

        if (relations.length === 0) {
          setFriends([]);
          return;
        }

        const detailedFriends = await Promise.all(
          relations.map(async (relation) => {
            const peerId =
              relation.friendId === userId
                ? relation.userId
                : relation.friendId;
            const targetId = peerId || relation.friendId || relation.userId;
            if (!targetId) return null;
            return fetchFriendDetails(targetId, token as string);
          })
        );

        const validFriends = detailedFriends.filter(
          (item): item is FriendProfile => Boolean(item)
        );

        setFriends(validFriends);
      } catch (error) {
        console.error("[MyFriendScreen] fetchFriends", error);
        setFriends([]);
        const message =
          error instanceof Error
            ? error.message
            : "Không thể kết nối đến máy chủ";
        setErrorMessage(message);
        Toast.show({
          type: "error",
          text1: "Không thể tải bạn bè",
          text2: message,
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

  const fetchPendingFriendRequests = useCallback(async () => {
    try {
      const token = await getSecureData("accessToken");
      const userId = await getUserIdFromToken();

      if (!token || !userId) {
        setHasPendingFriendRequests(false);
        return;
      }

      const endpoint = buildApiUrl("/users/friends/pending");
      if (!endpoint) {
        setHasPendingFriendRequests(false);
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
      const hasIncoming = relations.some((relation) => !relation.isSender);
      setHasPendingFriendRequests(hasIncoming);
    } catch (error) {
      console.error("[MyFriendScreen] fetchPendingFriendRequests", error);
      setHasPendingFriendRequests(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchFriends({ initial: true });
      void fetchPendingFriendRequests();
      return () => {
        /* no-op cleanup */
      };
    }, [fetchFriends, fetchPendingFriendRequests])
  );

  const handleRefresh = useCallback(() => {
    void Promise.all([
      fetchFriends({ initial: false }),
      fetchPendingFriendRequests(),
    ]);
  }, [fetchFriends, fetchPendingFriendRequests]);

  const handleFriendRemoved = useCallback((friendId: string) => {
    setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
  }, []);

  const summaryText = useMemo(() => {
    if (isLoading) {
      return "Đang tải danh sách bạn bè";
    }

    if (friends.length > 0) {
      return `Bạn có ${friends.length} người bạn`;
    }

    return "Chưa có bạn bè nào";
  }, [friends.length, isLoading]);

  const keyExtractor = useCallback((item: FriendProfile) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: FriendProfile }) => (
      <FriendCard friend={item} onFriendRemoved={handleFriendRemoved} />
    ),
    [handleFriendRemoved]
  );

  const listHeaderComponent = useMemo(() => {
    return (
      <View style={styles.summaryContainer}>
        {/* <Text style={styles.summaryTitle}>Danh sách bạn bè</Text> */}
        <Text style={styles.summarySubtitle}>{summaryText}</Text>
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}
      </View>
    );
  }, [errorMessage, summaryText]);

  const listEmptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator color={Colors.GREEN} size="large" />
          <Text style={styles.stateText}>Đang tải danh sách bạn bè...</Text>
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.emptyErrorContainer}>
          <Text style={styles.emptyErrorTitle}>Không thể tải dữ liệu</Text>
          <Text style={styles.emptyErrorSubtitle}>{errorMessage}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name="people-outline" size={44} color={Colors.GRAY} />
        <Text style={styles.emptyTitle}>Chưa có bạn bè</Text>
        <Text style={styles.emptySubtitle}>
          Hãy bắt đầu kết nối bằng cách gửi lời mời kết bạn!
        </Text>
      </View>
    );
  }, [errorMessage, isLoading]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.BLACK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bạn bè</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/notification")}
          style={styles.headerActionIcon}
          activeOpacity={0.8}
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color={Colors.BLACK}
          />
          {hasPendingFriendRequests ? (
            <View style={styles.notificationDot} />
          ) : null}
        </TouchableOpacity>
      </View>

      <FlatList
        data={friends}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={listHeaderComponent}
        ListEmptyComponent={listEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.GREEN]}
            tintColor={Colors.GREEN}
          />
        }
      />
    </View>
  );
};

export default MyFriendScreen;

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
    justifyContent: "space-between",
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
  headerActionIcon: {
    borderRadius: 12,
    padding: 5,
    backgroundColor: "#9c9c9c1e",
    marginLeft: 4,
    position: "relative",
  },
  notificationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F97316",
    position: "absolute",
    top: 4,
    right: 4,
  },
  headerRefreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 120,
    paddingTop: 18,
    gap: 16,
  },
  separator: {
    height: 16,
  },
  summaryContainer: {
    gap: 6,
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 24,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
  },
  summarySubtitle: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  errorBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorBannerText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.RED,
  },
  stateContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "center",
  },
  emptyErrorContainer: {
    paddingVertical: 50,
    paddingHorizontal: 24,
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FECACA",
    gap: 8,
  },
  emptyErrorTitle: {
    fontSize: 16,
    fontFamily: "inter-bold",
    color: Colors.RED,
    textAlign: "center",
  },
  emptyErrorSubtitle: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.RED,
    textAlign: "center",
  },
  emptyStateContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "center",
  },
});
