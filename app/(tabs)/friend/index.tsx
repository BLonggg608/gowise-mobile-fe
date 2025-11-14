import FriendGalleryCard from "@/components/Friend/FriendGalleryCard";
import FriendPostCard from "@/components/Friend/FriendPostCard";
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
};

export type FriendGallery = {
  galleryId: string;
  thumbnailUrl: string;
  photoCount: number;
  totalLikes: number;
  location?: string;
};

export type FriendPost = {
  postId: string;
  title: string;
  content: string;
  category: string;
  totalLikes: number;
  totalViews: number;
  publishedAt?: string;
};

type FeedGalleryItem = {
  kind: "gallery";
  key: string;
  friend: FriendProfile;
  gallery: FriendGallery;
};

type FeedPostItem = {
  kind: "post";
  key: string;
  friend: FriendProfile;
  post: FriendPost;
};

type FeedItem = FeedGalleryItem | FeedPostItem;

const statusBarHeight = Constants.statusBarHeight;

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";

  if (!domain) {
    console.error("[FriendFeed] Missing BE_DOMAIN configuration");
    return null;
  }

  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return port
    ? `${trimmedDomain}:${port}${normalizedPath}`
    : `${trimmedDomain}${normalizedPath}`;
};

const FriendScreen = () => {
  const router = useRouter();
  const [items, setItems] = useState<FeedItem[]>([]);
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
            `[FriendFeed] Failed to fetch user ${friendId}:`,
            reason
          );
          return null;
        }

        const payload = await response.json();
        const data = payload?.data ?? payload;

        return {
          id: String(data?.id ?? friendId),
          firstName: data?.firstName ?? "",
          lastName: data?.lastName ?? "",
          isPremium: Boolean(data?.isPremium),
          city: data?.city ?? undefined,
          createdAt: data?.createdAt ?? undefined,
        };
      } catch (error) {
        console.error(`[FriendFeed] Error fetching ${friendId}`, error);
        return null;
      }
    },
    []
  );

  const fetchFriendGalleries = useCallback(
    async (friendId: string, token: string): Promise<FriendGallery[]> => {
      const endpoint = buildApiUrl(`/api/gallery/user/${friendId}/galleries`);
      if (!endpoint) return [];

      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.warn(
            `[FriendFeed] Failed to fetch galleries for ${friendId}: ${response.status}`
          );
          return [];
        }

        const payload = await response.json();
        const raw: unknown[] = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];

        return raw.reduce<FriendGallery[]>((acc, item) => {
          if (typeof item !== "object" || item === null) {
            return acc;
          }

          const source = item as Record<string, unknown>;
          const galleryIdRaw =
            source.galleryId ?? source.id ?? source.uuid ?? source._id ?? "";
          const galleryId =
            typeof galleryIdRaw === "string"
              ? galleryIdRaw
              : galleryIdRaw != null
              ? String(galleryIdRaw)
              : "";

          if (!galleryId) {
            return acc;
          }

          const thumbnailRaw =
            source.thumbnailUrl ??
            source.coverUrl ??
            source.imageUrl ??
            source.photoUrl ??
            "";
          const photoCountRaw = source.photoCount ?? source.totalPhotos ?? 0;
          const likeCountRaw = source.totalLikes ?? source.likeCount ?? 0;

          const locationRaw =
            source.location ??
            source.locationName ??
            source.place ??
            source.city ??
            "";

          acc.push({
            galleryId,
            thumbnailUrl:
              typeof thumbnailRaw === "string"
                ? thumbnailRaw
                : thumbnailRaw != null
                ? String(thumbnailRaw)
                : "",
            photoCount:
              typeof photoCountRaw === "number"
                ? photoCountRaw
                : Number(photoCountRaw) || 0,
            totalLikes:
              typeof likeCountRaw === "number"
                ? likeCountRaw
                : Number(likeCountRaw) || 0,
            location:
              typeof locationRaw === "string"
                ? locationRaw
                : locationRaw != null
                ? String(locationRaw)
                : undefined,
          });
          return acc;
        }, []);
      } catch (error) {
        console.error(
          `[FriendFeed] Error fetching galleries ${friendId}`,
          error
        );
        return [];
      }
    },
    []
  );

  const fetchFriendPosts = useCallback(
    async (friendId: string, token: string): Promise<FriendPost[]> => {
      const endpoint = buildApiUrl(`/api/posts/me?page=0&size=10`);
      if (!endpoint) return [];

      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-User-Id": friendId,
          },
        });

        if (!response.ok) {
          console.warn(
            `[FriendFeed] Failed to fetch posts for ${friendId}: ${response.status}`
          );
          return [];
        }

        const payload = await response.json();
        const items = Array.isArray(payload?.data?.items)
          ? payload.data.items
          : [];

        const approvedItems = items.filter(
          (item: any) => item?.status?.toString().toUpperCase() === "APPROVED"
        );

        return approvedItems.map(
          (item: any): FriendPost => ({
            postId: String(item?.postId ?? item?.id ?? item?._id ?? ""),
            title: item?.title ?? "Untitled",
            content: item?.content ?? "",
            category: item?.category ?? "Khác",
            totalLikes: Number(item?.totalLikes ?? item?.likeCount ?? 0),
            totalViews: Number(item?.totalViews ?? item?.viewCount ?? 0),
            publishedAt: item?.publishedAt ?? item?.createdAt ?? undefined,
          })
        );
      } catch (error) {
        console.error(`[FriendFeed] Error fetching posts ${friendId}`, error);
        return [];
      }
    },
    []
  );

  const fetchFeed = useCallback(
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
          setItems([]);
          setErrorMessage("Không thể xác định thông tin người dùng");
          return;
        }

        const endpoint = buildApiUrl("/users/friends/accepted");
        if (!endpoint) {
          setItems([]);
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
          setItems([]);
          return;
        }

        const friendEntries = await Promise.all(
          relations.map(async (relation) => {
            const targetId = relation.friendId || relation.userId;
            if (!targetId) return null;

            const friend = await fetchFriendDetails(targetId, token as string);
            if (!friend) return null;

            const [galleries, posts] = await Promise.all([
              fetchFriendGalleries(friend.id, token as string),
              fetchFriendPosts(friend.id, token as string),
            ]);

            return { friend, galleries, posts };
          })
        );

        const feedItems: FeedItem[] = [];

        friendEntries
          .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
          .forEach(({ friend, galleries, posts }) => {
            galleries.forEach((gallery, index) => {
              feedItems.push({
                kind: "gallery",
                key: `gallery-${friend.id}-${gallery.galleryId}-${index}`,
                friend,
                gallery,
              });
            });

            posts.forEach((post, index) => {
              feedItems.push({
                kind: "post",
                key: `post-${friend.id}-${post.postId}-${index}`,
                friend,
                post,
              });
            });
          });

        setItems(feedItems);
      } catch (error) {
        console.error("[FriendFeed] fetchFeed error", error);
        setItems([]);
        const message =
          error instanceof Error
            ? error.message
            : "Không thể kết nối đến máy chủ";
        setErrorMessage(message);
        Toast.show({
          type: "error",
          text1: "Không thể tải dữ liệu bạn bè",
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
    [fetchFriendDetails, fetchFriendGalleries, fetchFriendPosts]
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
      console.error("[FriendFeed] fetchPendingFriendRequests", error);
      setHasPendingFriendRequests(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchFeed({ initial: true });
      void fetchPendingFriendRequests();
      return () => {
        /* no-op cleanup */
      };
    }, [fetchFeed, fetchPendingFriendRequests])
  );

  const handleRefresh = useCallback(() => {
    void Promise.all([
      fetchFeed({ initial: false }),
      fetchPendingFriendRequests(),
    ]);
  }, [fetchFeed, fetchPendingFriendRequests]);

  const summaryText = useMemo(() => {
    if (isLoading) {
      return "Đang tải hoạt động bạn bè";
    }

    if (items.length > 0) {
      return `Có ${items.length} cập nhật từ bạn bè`;
    }

    return "Chưa có hoạt động nào từ bạn bè";
  }, [isLoading, items.length]);

  const renderItem = useCallback(({ item }: { item: FeedItem }) => {
    if (item.kind === "gallery") {
      return <FriendGalleryCard friend={item.friend} gallery={item.gallery} />;
    }
    return <FriendPostCard friend={item.friend} post={item.post} />;
  }, []);

  const keyExtractor = useCallback((item: FeedItem) => item.key, []);

  const listHeaderComponent = useMemo(() => {
    return (
      <View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/friend/my-friend")}
          style={styles.myFriendButton}
        >
          <Ionicons name="people-outline" size={20} color={Colors.WHITE} />
          <Text style={styles.myFriendButtonText}>Xem bạn bè của tôi</Text>
        </TouchableOpacity>
        <Text style={styles.summarySubtitle}>{summaryText}</Text>
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}
      </View>
    );
  }, [errorMessage, summaryText, router]);

  const listEmptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator color={Colors.GREEN} size="large" />
          <Text style={styles.stateText}>Đang tải hoạt động bạn bè...</Text>
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
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>Chưa có gì để hiển thị</Text>
        <Text style={styles.stateText}>
          Kết nối với bạn bè để khám phá bài viết và album ảnh mới nhất của họ.
        </Text>
      </View>
    );
  }, [errorMessage, isLoading]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeaderRow}>
          <Text style={styles.summaryTitle}>Bảng tin bạn bè</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/notification")}
            style={styles.summaryActionIcon}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.BLACK}
            />
            {hasPendingFriendRequests ? (
              <View style={styles.notificationDot} />
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeaderComponent}
        ListEmptyComponent={listEmptyComponent}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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

export default FriendScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  listContent: {
    // paddingTop: statusBarHeight + 12,
    paddingHorizontal: 18,
    paddingBottom: 48,
    gap: 16,
  },
  summaryContainer: {
    paddingTop: statusBarHeight + 12,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  summaryTitle: {
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    fontSize: 22,
  },
  summaryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryActionIcon: {
    borderRadius: 12,
    padding: 5,
    backgroundColor: "#9c9c9c1e",
    marginLeft: 4,
    position: "relative",
  },
  summarySubtitle: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginTop: 16,
  },
  myFriendButton: {
    backgroundColor: Colors.GREEN,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    marginVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  myFriendButtonText: {
    color: Colors.WHITE,
    fontSize: 14,
    fontFamily: "inter-medium",
    marginLeft: 8,
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
  separator: {
    height: 16,
  },
  stateContainer: {
    paddingVertical: 60,
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
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "center",
  },
  emptyErrorContainer: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    gap: 8,
  },
  emptyErrorTitle: {
    fontSize: 16,
    fontFamily: "inter-bold",
    color: Colors.RED,
  },
  emptyErrorSubtitle: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.RED,
    textAlign: "center",
  },
});
