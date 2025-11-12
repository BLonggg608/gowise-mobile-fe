import BlogCard, { BlogListItem } from "@/components/Blog/BlogCard";
import BlogDetailModal from "@/components/Blog/BlogDetailModal";
import CreateBlogModal from "@/components/Blog/CreateBlogModal";
import { Colors } from "@/constant/Colors";
import { getData, saveData } from "@/utils/localStorage";
import { getSecureData } from "@/utils/storage";
import { decodeToken, getUserIdFromToken } from "@/utils/tokenUtils";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "toastify-react-native";

const statusBarHeight = Constants.statusBarHeight;
const LIKED_BLOG_STORAGE_KEY = "likedBlogPostIds";

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";

  if (!domain) {
    console.error("[BlogScreen] Missing BE_DOMAIN configuration");
    return null;
  }

  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return port
    ? `${trimmedDomain}:${port}${normalizedPath}`
    : `${trimmedDomain}${normalizedPath}`;
};

const ensureString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const ensureNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
};

const deriveId = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "$oid" in value &&
    typeof (value as { $oid?: unknown }).$oid === "string"
  ) {
    const oid = (value as { $oid: string }).$oid.trim();
    return oid.length > 0 ? oid : null;
  }
  return null;
};

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (value: string, limit = 180) =>
  value.length > limit ? `${value.slice(0, limit).trim()}…` : value;

const formatDateLabel = (input?: string) => {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatRelativeTime = (input?: string) => {
  if (!input) return "Không rõ";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Không rõ";

  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 0) return "Sắp tới";

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return "Vừa đăng";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} tuần trước`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} tháng trước`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} năm trước`;
};

const formatNumber = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString("vi-VN") : "0";

const estimateReadTime = (content: string) => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return undefined;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} phút đọc`;
};

const resolveRoleFromToken = (token: string | null): string | undefined => {
  if (!token) return undefined;

  try {
    const decoded = decodeToken(token);
    if (!decoded) return undefined;

    const roleDirect = decoded.role;
    if (typeof roleDirect === "string" && roleDirect.trim().length > 0) {
      return roleDirect.trim();
    }

    const rolesCollection = decoded.roles;
    if (Array.isArray(rolesCollection)) {
      const candidate = rolesCollection.find(
        (role): role is string =>
          typeof role === "string" && role.trim().length > 0
      );
      if (candidate) {
        return candidate.trim();
      }
    }
  } catch (error) {
    console.warn("[BlogScreen] resolve role error", error);
  }

  return undefined;
};

const normalizeStatusLabel = (input: string) => {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized.includes("publish")) return "Đã xuất bản";
  if (normalized.includes("draft")) return "Bản nháp";
  if (normalized.includes("pending")) return "Chờ duyệt";
  if (normalized.includes("archiv")) return "Đã lưu trữ";
  if (normalized.includes("hidden")) return "Ẩn";
  return input
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((part) =>
      part.length > 0 ? part[0].toUpperCase() + part.slice(1).toLowerCase() : ""
    )
    .join(" ");
};

const resolvePostsCollection = (payload: any): Record<string, unknown>[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.posts)) return payload.posts;
  if (Array.isArray(payload?.data?.posts)) return payload.data.posts;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  const dataItems = payload?.data?.items;
  if (Array.isArray(dataItems)) return dataItems;
  if (dataItems && typeof dataItems === "object") {
    if (Array.isArray(dataItems.content)) return dataItems.content;
    if (Array.isArray(dataItems.items)) return dataItems.items;
    if (Array.isArray(dataItems.data)) return dataItems.data;
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const resolvePostDetail = (payload: any): Record<string, unknown> | null => {
  if (!payload) return null;
  if (Array.isArray(payload)) {
    const candidate = payload[0];
    return candidate && typeof candidate === "object"
      ? (candidate as Record<string, unknown>)
      : null;
  }

  if (payload && typeof payload === "object") {
    if (
      payload.data &&
      typeof payload.data === "object" &&
      !Array.isArray(payload.data)
    ) {
      return payload.data as Record<string, unknown>;
    }
    if (payload.post && typeof payload.post === "object") {
      return payload.post as Record<string, unknown>;
    }
    if (payload.item && typeof payload.item === "object") {
      return payload.item as Record<string, unknown>;
    }
    return payload as Record<string, unknown>;
  }

  return null;
};

const mapApiBlogPost = (item: Record<string, unknown>): BlogListItem | null => {
  const id =
    deriveId(item._id) ??
    deriveId(item.id) ??
    deriveId(item.postId) ??
    deriveId(item.post_id) ??
    deriveId(item.blogId) ??
    deriveId(item.articleId) ??
    deriveId(item.slug);

  if (!id) return null;

  const title =
    ensureString(item.title) ||
    ensureString(item.name) ||
    "Bài viết chưa có tiêu đề";

  const summaryCandidate =
    ensureString(item.excerpt) ||
    ensureString(item.summary) ||
    ensureString(item.subtitle) ||
    ensureString(item.subTitle) ||
    ensureString(item.description) ||
    ensureString(item.content);

  const cleanedSummary = stripHtml(summaryCandidate);
  const summary = cleanedSummary ? truncate(cleanedSummary) : undefined;

  const thumbnailCandidate =
    ensureString(item.thumbnailUrl) ||
    ensureString(item.coverImage) ||
    ensureString(item.imageUrl) ||
    ensureString(item.bannerUrl) ||
    ensureString((item.banner as { url?: string })?.url);

  const contentRaw =
    ensureString(item.content) ||
    ensureString(item.body) ||
    ensureString(item.descriptionHtml) ||
    "";

  const contentText = contentRaw ? stripHtml(contentRaw) : undefined;

  const createdAt =
    ensureString(item.publishedAt) ||
    ensureString(item.createdAt) ||
    ensureString(item.created_at) ||
    ensureString(item.updatedAt);

  const createdLabel = formatDateLabel(createdAt);
  const createdValue = (() => {
    const date = createdAt ? new Date(createdAt) : null;
    return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
  })();

  const likesValue =
    (Array.isArray(item.likes) ? item.likes.length : null) ??
    ensureNumber(item.likeCount) ??
    ensureNumber(item.totalLikes) ??
    ensureNumber(item.likes) ??
    0;

  const viewsValue =
    ensureNumber(item.viewCount) ??
    ensureNumber(item.totalViews) ??
    ensureNumber(item.views) ??
    0;

  const rawTags = Array.isArray(item.tags)
    ? item.tags
    : Array.isArray(item.categories)
    ? item.categories
    : [];

  const tags = rawTags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 5);

  const statusRaw = ensureString(item.status);
  const statusValueRaw = statusRaw ? statusRaw.trim().toLowerCase() : undefined;
  const statusValue = (() => {
    if (!statusValueRaw) return undefined;
    if (
      statusValueRaw.includes("publish") ||
      statusValueRaw.includes("approve")
    ) {
      return "approved";
    }
    if (
      statusValueRaw.includes("reject") ||
      statusValueRaw.includes("deny") ||
      statusValueRaw.includes("decline") ||
      statusValueRaw.includes("refuse")
    ) {
      return "rejected";
    }
    if (
      statusValueRaw.includes("pending") ||
      statusValueRaw.includes("review") ||
      statusValueRaw.includes("wait")
    ) {
      return "pending";
    }
    return statusValueRaw;
  })();
  const statusLabel = statusRaw ? normalizeStatusLabel(statusRaw) : undefined;

  const category =
    ensureString(item.category) ||
    ensureString(item.categoryName) ||
    (Array.isArray(item.categories)
      ? ensureString(item.categories[0])
      : undefined) ||
    (Array.isArray(item.tags) ? ensureString(item.tags[0]) : "");

  const normalizedCategory =
    category.trim().length > 0 ? category.trim() : undefined;
  const categoryValue = normalizedCategory
    ? normalizedCategory.toLowerCase()
    : undefined;

  const authorLabel =
    ensureString(item.author) ||
    ensureString(item.authorName) ||
    ensureString(item.createdBy) ||
    ensureString(item.writer) ||
    undefined;

  const publishDateLabel =
    ensureString(item.publishDateLabel) ||
    ensureString(item.published_label) ||
    createdLabel;

  const readTimeLabel =
    ensureString(item.readTime) ||
    ensureString(item.read_time) ||
    (contentText ? estimateReadTime(contentText) : undefined);

  return {
    id,
    title,
    summary,
    thumbnailUrl: thumbnailCandidate || undefined,
    createdLabel,
    createdValue,
    relativeTime: formatRelativeTime(createdAt),
    likes: likesValue,
    views: viewsValue,
    statusLabel,
    statusValue,
    tags,
    category: normalizedCategory,
    categoryValue,
    author: authorLabel,
    publishDateLabel,
    readTimeLabel,
    content: contentRaw || undefined,
    contentText,
    raw: item,
  };
};

const BlogScreen = () => {
  const [posts, setPosts] = useState<BlogListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"created" | "likes" | "views">(
    "created"
  );
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogListItem | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);

  const sortOptions: {
    value: "created" | "likes" | "views";
    label: string;
  }[] = useMemo(
    () => [
      { value: "created", label: "Ngày tạo" },
      { value: "likes", label: "Lượt thích" },
      { value: "views", label: "Lượt xem" },
    ],
    []
  );

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "Tất cả thể loại" },
      { value: "du lịch", label: "Du lịch" },
      { value: "địa điểm ăn chơi", label: "Địa điểm ăn chơi" },
      { value: "đô ăn & nước uống", label: "Đồ ăn & nước uống" },
      { value: "du lịch tiết kiệm", label: "Du lịch tiết kiệm" },
    ],
    []
  );

  const fetchPosts = useCallback(
    async ({ initial = false }: { initial?: boolean } = {}) => {
      if (initial) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const token = await getSecureData("accessToken");
        const userId = await getUserIdFromToken();

        if (!token) {
          console.warn("[BlogScreen] Missing access token");
          setPosts([]);
          return;
        }

        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        if (userId) {
          headers["X-User-Id"] = userId;
        }

        const endpointCandidates = ["/api/posts/me", "/api/posts"];
        let payload: any = null;
        let lastError: Error | null = null;

        for (const candidate of endpointCandidates) {
          const endpoint = buildApiUrl(candidate);
          if (!endpoint) continue;

          try {
            const response = await fetch(endpoint, {
              method: "GET",
              headers,
            });

            if (!response.ok) {
              const reason = await response.text();
              lastError = new Error(
                reason || `Request failed with status ${response.status}`
              );
              continue;
            }

            payload = await response.json();
            // console.log(payload);
            lastError = null;
            break;
          } catch (error) {
            lastError =
              error instanceof Error
                ? error
                : new Error("Không thể kết nối tới máy chủ.");
          }
        }

        if (!payload) {
          throw (
            lastError ?? new Error("Không thể tải dữ liệu blog từ máy chủ.")
          );
        }

        const collection = resolvePostsCollection(payload);

        const mapped = collection
          .map((item) =>
            item && typeof item === "object"
              ? mapApiBlogPost(item as Record<string, unknown>)
              : null
          )
          .filter((item): item is BlogListItem => Boolean(item));

        setPosts(mapped);
      } catch (error) {
        console.error("[BlogScreen] fetchPosts error", error);
        Toast.show({
          type: "error",
          text1: "Không thể tải blog",
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
    []
  );

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const stored = await getData(LIKED_BLOG_STORAGE_KEY);
        if (!isMounted) return;
        if (Array.isArray(stored)) {
          const normalized = stored
            .map((value: unknown) => {
              if (typeof value === "string") return value.trim();
              if (typeof value === "number") return String(value);
              return "";
            })
            .filter((value) => value.length > 0);
          setLikedPostIds(new Set(normalized));
        }
      } catch (error) {
        console.error("[BlogScreen] load liked posts error", error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPosts({ initial: true });
    }, [fetchPosts])
  );

  const handleRefresh = useCallback(() => {
    fetchPosts({ initial: false });
  }, [fetchPosts]);

  const handleCreatePost = useCallback(() => {
    setIsCreateModalVisible(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalVisible(false);
  }, []);

  const handlePostCreated = useCallback(() => {
    setIsCreateModalVisible(false);
    void fetchPosts({ initial: true });
  }, [fetchPosts]);

  const handleOpenDetail = useCallback((post: BlogListItem) => {
    setSelectedPost(post);
    setIsDetailModalVisible(true);

    const endpoint = buildApiUrl(`/api/posts/${post.id}`);
    if (!endpoint) {
      Toast.show({
        type: "error",
        text1: "Thiếu cấu hình",
        text2: "Không xác định được máy chủ Blog.",
      });
      return;
    }

    setIsDetailLoading(true);

    (async () => {
      try {
        const rawToken = await getSecureData("accessToken");
        const token =
          typeof rawToken === "string" && rawToken.trim().length > 0
            ? rawToken
            : null;
        const userId = await getUserIdFromToken();

        if (!token || !userId) {
          Toast.show({
            type: "info",
            text1: "Cần đăng nhập",
            text2: "Vui lòng đăng nhập để xem chi tiết bài viết.",
          });
          setIsDetailLoading(false);
          setTimeout(() => {
            setIsDetailModalVisible(false);
          }, 1200);
          return;
        }

        const primaryRole = resolveRoleFromToken(token);

        const performRequest = async (useAuthHeader: boolean) => {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-User-Id": userId,
          };

          if (primaryRole) {
            headers["X-User-Roles"] = primaryRole;
          }

          if (useAuthHeader) {
            headers.Authorization = `Bearer ${token}`;
          }

          headers.Cookie = `accessToken=${encodeURIComponent(token)}`;

          return fetch(endpoint, {
            method: "GET",
            headers,
          });
        };

        let response = await performRequest(true);

        if (response.status === 401) {
          response = await performRequest(false);
        }

        if (response.status === 404) {
          setIsDetailLoading(false);
          Toast.show({
            type: "info",
            text1: "Bài viết không tồn tại",
            text2: "Bài viết có thể đã bị xoá hoặc không khả dụng.",
          });
          setTimeout(() => {
            setIsDetailModalVisible(false);
          }, 1200);
          return;
        }

        if (response.status === 401) {
          const reason = await response.text();
          throw new Error(
            reason || "Cần đăng nhập lại để xem chi tiết bài viết."
          );
        }

        if (!response.ok) {
          const reason = await response.text();
          throw new Error(reason || "Không thể tải chi tiết bài viết.");
        }

        let payload: any = null;
        try {
          payload = await response.json();
        } catch (parseError) {
          console.warn("[BlogScreen] detail parse error", parseError);
        }

        const detailRecord = resolvePostDetail(payload);
        if (!detailRecord) return;

        const mappedDetail = mapApiBlogPost(
          detailRecord as Record<string, unknown>
        );

        if (!mappedDetail) return;

        setPosts((prev) =>
          prev.map((item) => {
            if (item.id !== mappedDetail.id) return item;
            const mergedTags = new Set([
              ...(item.tags ?? []),
              ...(mappedDetail.tags ?? []),
            ]);
            return {
              ...item,
              ...mappedDetail,
              tags: mergedTags.size > 0 ? Array.from(mergedTags) : undefined,
            };
          })
        );

        setSelectedPost((prev) => {
          if (!prev || prev.id !== mappedDetail.id) {
            return mappedDetail;
          }

          const mergedTags = new Set([
            ...(prev.tags ?? []),
            ...(mappedDetail.tags ?? []),
          ]);

          return {
            ...prev,
            ...mappedDetail,
            tags: mergedTags.size > 0 ? Array.from(mergedTags) : undefined,
          };
        });
      } catch (error) {
        console.log("[BlogScreen] detail fetch error", error);

        if (
          error instanceof Error &&
          error.message.includes("Authentication required or token invalid")
        ) {
          return;
        }

        Toast.show({
          type: "error",
          text1: "Không thể tải chi tiết",
          text2:
            error instanceof Error
              ? error.message
              : "Đã xảy ra lỗi khi tải chi tiết bài viết.",
        });

        if (
          error instanceof Error &&
          (error.message.toLowerCase().includes("đăng nhập") ||
            error.message.toLowerCase().includes("hết hạn"))
        ) {
          setTimeout(() => {
            setIsDetailModalVisible(false);
          }, 1200);
        }
      } finally {
        setIsDetailLoading(false);
      }
    })();
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailModalVisible(false);
    setSelectedPost(null);
    setIsDetailLoading(false);
  }, []);

  const handleToggleLike = useCallback(
    async (post: BlogListItem) => {
      if (!post) return;
      if (isLikeProcessing) return;

      const endpoint = buildApiUrl(`/api/posts/${post.id}/like`);
      if (!endpoint) {
        Toast.show({
          type: "error",
          text1: "Thiếu cấu hình",
          text2: "Không xác định được máy chủ Blog.",
        });
        return;
      }

      const rawToken = await getSecureData("accessToken");
      const token =
        typeof rawToken === "string" && rawToken.trim().length > 0
          ? rawToken
          : null;
      const userId = await getUserIdFromToken();
      const primaryRole = resolveRoleFromToken(token);

      if (!token || !userId) {
        Toast.show({
          type: "error",
          text1: "Cần đăng nhập",
          text2: "Vui lòng đăng nhập để thao tác thích bài viết.",
        });
        return;
      }

      setIsLikeProcessing(true);

      try {
        const alreadyLiked = likedPostIds.has(post.id);

        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-User-Id": userId,
        };

        if (primaryRole) {
          headers["X-User-Roles"] = primaryRole;
        }

        headers.Cookie = `accessToken=${encodeURIComponent(token)}`;

        const response = await fetch(endpoint, {
          method: alreadyLiked ? "DELETE" : "POST",
          headers,
        });

        if (!response.ok) {
          const reason = await response.text();
          if (response.status === 401) {
            Toast.show({
              type: "error",
              text1: "Phiên hết hạn",
              text2: "Vui lòng đăng nhập lại để tiếp tục.",
            });
            setTimeout(() => {
              setIsDetailModalVisible(false);
            }, 1200);
          }
          throw new Error(
            reason || "Không thực hiện được thao tác thích bài viết."
          );
        }

        let payload: any = null;
        try {
          payload = await response.json();
        } catch (parseError) {
          console.warn("[BlogScreen] like parse error", parseError);
        }

        const detailRecord = resolvePostDetail(payload);
        const mappedDetail = detailRecord
          ? mapApiBlogPost(detailRecord as Record<string, unknown>)
          : null;

        const updatedIds = new Set(likedPostIds);
        if (alreadyLiked) {
          updatedIds.delete(post.id);
        } else {
          updatedIds.add(post.id);
        }

        setLikedPostIds(updatedIds);

        try {
          await saveData({
            key: LIKED_BLOG_STORAGE_KEY,
            value: Array.from(updatedIds),
          });
        } catch (storageError) {
          console.error("[BlogScreen] like storage error", storageError);
        }

        const computedLikes = (() => {
          if (typeof mappedDetail?.likes === "number") {
            return mappedDetail.likes;
          }
          const base = post.likes ?? 0;
          const delta = alreadyLiked ? -1 : 1;
          return Math.max(0, base + delta);
        })();

        setPosts((prev) =>
          prev.map((item) => {
            if (item.id !== post.id) return item;
            if (mappedDetail && mappedDetail.id === post.id) {
              const mergedTags = new Set([
                ...(item.tags ?? []),
                ...(mappedDetail.tags ?? []),
              ]);
              return {
                ...item,
                ...mappedDetail,
                likes: computedLikes,
                tags: mergedTags.size > 0 ? Array.from(mergedTags) : undefined,
              };
            }
            return { ...item, likes: computedLikes };
          })
        );

        setSelectedPost((prev) => {
          if (!prev || prev.id !== post.id) return prev;

          if (mappedDetail && mappedDetail.id === post.id) {
            const mergedTags = new Set([
              ...(prev.tags ?? []),
              ...(mappedDetail.tags ?? []),
            ]);
            return {
              ...prev,
              ...mappedDetail,
              likes: computedLikes,
              tags: mergedTags.size > 0 ? Array.from(mergedTags) : undefined,
            };
          }

          return { ...prev, likes: computedLikes };
        });

        // Toast.show({
        //   type: "success",
        //   text1: alreadyLiked ? "Đã bỏ thích" : "Đã thích bài viết",
        //   text2: alreadyLiked
        //     ? "Bạn đã bỏ thích bài viết này."
        //     : "Bạn đã thích bài viết này.",
        // });
      } catch (error) {
        console.error("[BlogScreen] like error", error);
        Toast.show({
          type: "error",
          text1: "Không thể cập nhật lượt thích",
          text2:
            error instanceof Error
              ? error.message
              : "Đã xảy ra lỗi khi cập nhật lượt thích.",
        });
      } finally {
        setIsLikeProcessing(false);
      }
    },
    [isLikeProcessing, likedPostIds]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleSelectStatus = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const performDeletePost = useCallback(
    async (post: BlogListItem) => {
      const endpoint = buildApiUrl(`/api/posts/${post.id}`);
      if (!endpoint) {
        Toast.show({
          type: "error",
          text1: "Thiếu cấu hình",
          text2: "Không xác định được máy chủ Blog.",
        });
        return;
      }

      const userId = await getUserIdFromToken();
      if (!userId) {
        Toast.show({
          type: "error",
          text1: "Cần đăng nhập",
          text2: "Vui lòng đăng nhập để xoá bài viết.",
        });
        return;
      }

      const token = await getSecureData("accessToken");

      setDeletingPostId(post.id);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(endpoint, {
          method: "DELETE",
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            errorText || "Không thể xoá bài viết. Vui lòng thử lại sau."
          );
        }

        setPosts((prev) => prev.filter((item) => item.id !== post.id));

        Toast.show({
          type: "success",
          text1: "Đã xoá bài viết",
          text2: "Bài viết đã được xoá khỏi bảng tin.",
        });
      } catch (error) {
        console.error("[BlogScreen] deletePost error", error);
        Toast.show({
          type: "error",
          text1: "Không thể xoá bài viết",
          text2:
            error instanceof Error
              ? error.message
              : "Đã xảy ra lỗi, vui lòng thử lại sau.",
        });
      } finally {
        setDeletingPostId(null);
      }
    },
    [setPosts]
  );

  const handleDeletePost = useCallback(
    (post: BlogListItem) => {
      if (deletingPostId && deletingPostId !== post.id) {
        Toast.show({
          type: "info",
          text1: "Đang xoá bài khác",
          text2: "Vui lòng đợi thao tác xoá hiện tại hoàn tất.",
        });
        return;
      }

      Alert.alert(
        "Xoá bài viết",
        `Bạn có chắc chắn muốn xoá "${post.title}"?`,
        [
          { text: "Huỷ", style: "cancel" },
          {
            text: "Xoá",
            style: "destructive",
            onPress: () => {
              void performDeletePost(post);
            },
          },
        ]
      );
    },
    [deletingPostId, performDeletePost]
  );

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = posts.filter((post) => {
      const matchesStatus =
        statusFilter === "all" || post.statusValue === statusFilter;

      if (!matchesStatus) return false;

      const normalizedCategory =
        post.categoryValue ?? post.category?.toLowerCase();
      const matchesCategory =
        selectedCategory === "all" || normalizedCategory === selectedCategory;

      if (!matchesCategory) return false;

      if (!query) return true;

      const haystack = [
        post.title,
        post.summary,
        post.statusLabel,
        post.category,
        ...(post.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "likes":
          return (b.likes ?? 0) - (a.likes ?? 0);
        case "views":
          return (b.views ?? 0) - (a.views ?? 0);
        case "created":
        default:
          return (b.createdValue ?? 0) - (a.createdValue ?? 0);
      }
    });

    return sorted;
  }, [posts, searchQuery, selectedCategory, sortBy, statusFilter]);

  const statusCounts = useMemo(() => {
    return posts.reduce<Record<string, number>>((acc, post) => {
      if (post.statusValue) {
        acc[post.statusValue] = (acc[post.statusValue] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [posts]);

  const statusOptions = useMemo(
    () => ["all", "approved", "pending", "rejected"],
    []
  );

  const stats = useMemo(() => {
    const total = posts.length;
    const filtered = filteredPosts.length;
    const published = posts.filter((post) =>
      (post.statusValue ?? "").includes("publish")
    ).length;
    const likes = posts.reduce((sum, post) => sum + (post.likes ?? 0), 0);
    const views = posts.reduce((sum, post) => sum + (post.views ?? 0), 0);

    return { total, filtered, published, likes, views };
  }, [filteredPosts.length, posts]);

  const listHeaderComponent = useMemo(
    () => (
      <View style={styles.listHeader}>
        <Text style={styles.headerSubtitle}>
          Theo dõi và quản lý các bài viết du lịch của bạn ✈️
        </Text>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={[styles.statLabel, styles.statLabelLight]}>
              Tổng bài viết
            </Text>
            <Text style={[styles.statValue, styles.statValueLight]}>
              {formatNumber(stats.total)}
            </Text>
            {/* <Text style={[styles.statCaption, styles.statCaptionLight]}>
              {formatNumber(stats.published)} bài viết đã xuất bản
            </Text> */}
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Đang hiển thị</Text>
            <Text style={styles.statValue}>{formatNumber(stats.filtered)}</Text>
            {/* <Text style={styles.statCaption}>Theo bộ lọc hiện tại</Text> */}
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Lượt thích</Text>
            <Text style={styles.statValue}>{formatNumber(stats.likes)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Lượt xem</Text>
            <Text style={styles.statValue}>{formatNumber(stats.views)}</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons color={Colors.GRAY} name="search-outline" size={18} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearchQuery}
            placeholder="Tìm bài viết"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              onPress={handleClearSearch}
              style={styles.clearButton}
            >
              <Ionicons color={Colors.GRAY} name="close-circle" size={18} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
          Trạng thái:
        </Text>
        {statusOptions.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={styles.filterScroll}
          >
            {statusOptions.map((status) => {
              const isAll = status === "all";
              const isActive = statusFilter === status;
              const count = isAll ? stats.total : statusCounts[status] ?? 0;
              // const label = isAll
              //   ? `Tất cả (${formatNumber(count)})`
              //   : `${normalizeStatusLabel(status)} (${formatNumber(count)})`;

              // all is Tất cả, approved is Đã duyệt, rejected is Bị từ chối
              const labelmap: Record<string, string> = {
                all: "Tất cả",
                approved: "Đã duyệt",
                pending: "Chờ duyệt",
                rejected: "Bị từ chối",
              };

              const label = `${labelmap[status] ?? status} (${formatNumber(
                count
              )})`;

              return (
                <TouchableOpacity
                  activeOpacity={0.82}
                  key={status}
                  onPress={() => handleSelectStatus(status)}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isActive && styles.filterTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        <Text style={styles.sectionTitle}>Thể loại:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {categoryOptions.map((option) => {
            const isActive = selectedCategory === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.85}
                onPress={() => setSelectedCategory(option.value)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Sắp xếp theo:</Text>
        <View style={styles.sortRow}>
          {sortOptions.map((option) => {
            const isActive = sortBy === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.85}
                onPress={() => setSortBy(option.value)}
                style={[styles.sortOption, isActive && styles.sortOptionActive]}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    isActive && styles.sortOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    ),
    [
      handleClearSearch,
      handleSelectStatus,
      categoryOptions,
      searchQuery,
      selectedCategory,
      statusCounts,
      statusFilter,
      statusOptions,
      sortBy,
      sortOptions,
      stats.filtered,
      stats.likes,
      stats.total,
      stats.views,
    ]
  );

  const emptyComponent = useMemo(
    () => (
      <View style={styles.emptyState}>
        {isLoading ? (
          <>
            <ActivityIndicator color={Colors.GREEN} size="large" />
            <Text style={styles.emptyTitle}>Đang tải bài viết...</Text>
            <Text style={styles.emptyDescription}>
              Vui lòng chờ trong giây lát.
            </Text>
          </>
        ) : (
          <>
            <Ionicons color={Colors.GRAY} name="documents-outline" size={40} />
            <Text style={styles.emptyTitle}>Chưa có bài viết phù hợp</Text>
            <Text style={styles.emptyDescription}>
              Thử thay đổi bộ lọc hoặc tạo bài viết mới nhé.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreatePost}
              style={styles.primaryButton}
            >
              <Ionicons color={Colors.WHITE} name="add" size={18} />
              <Text style={styles.primaryButtonText}>Tạo bài viết</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    ),
    [handleCreatePost, isLoading]
  );

  const renderPost = useCallback<ListRenderItem<BlogListItem>>(
    ({ item }) => (
      <BlogCard
        blog={item}
        isDeleting={deletingPostId === item.id}
        onDelete={() => handleDeletePost(item)}
        onPress={() => handleOpenDetail(item)}
      />
    ),
    [deletingPostId, handleDeletePost, handleOpenDetail]
  );

  const keyExtractor = useCallback((item: BlogListItem) => item.id, []);

  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      filteredPosts.length === 0 ? styles.listContentEmpty : null,
    ],
    [filteredPosts.length]
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>Blog Du Lịch</Text>
        </View>
        {/* <View style={styles.headerActions}>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleRefresh}
            style={styles.headerActionButton}
          >
            <Ionicons color={Colors.GREEN} name="refresh-outline" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleOpenSettings}
            style={styles.headerActionButton}
          >
            <Ionicons color={Colors.GREEN} name="settings-outline" size={18} />
          </TouchableOpacity>
        </View> */}
      </View>

      <FlatList
        contentContainerStyle={listContentStyle}
        data={filteredPosts}
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={<View style={styles.footerSpacer} />}
        ListHeaderComponent={listHeaderComponent}
        refreshControl={
          <RefreshControl
            colors={[Colors.GREEN]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={Colors.GREEN}
          />
        }
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleCreatePost}
        style={styles.fab}
      >
        <Ionicons color={Colors.WHITE} name="create-outline" size={24} />
      </TouchableOpacity>

      <CreateBlogModal
        onClose={handleCloseCreateModal}
        onCreated={handlePostCreated}
        visible={isCreateModalVisible}
      />

      <BlogDetailModal
        isLikeProcessing={isLikeProcessing}
        isLiked={selectedPost ? likedPostIds.has(selectedPost.id) : false}
        isLoading={isDetailLoading}
        onClose={handleCloseDetail}
        onToggleLike={() => {
          if (selectedPost) {
            void handleToggleLike(selectedPost);
          }
        }}
        post={selectedPost}
        visible={isDetailModalVisible}
      />
    </View>
  );
};

export default BlogScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerBar: {
    paddingTop: statusBarHeight + 12,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    fontSize: 22,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerActionButton: {
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    marginLeft: 8,
    paddingHorizontal: 12,
  },
  listHeader: {
    paddingTop: 20,
    marginBottom: 8,
  },
  searchContainer: {
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    color: Colors.BLACK,
    flex: 1,
    fontFamily: "inter-regular",
    fontSize: 14,
    marginLeft: 10,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    elevation: 1,
    marginBottom: 16,
    padding: 16,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    width: "48%",
  },
  statCardHighlight: {
    backgroundColor: Colors.GREEN,
  },
  statLabel: {
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    fontSize: 12,
  },
  statLabelLight: {
    color: "rgba(255,255,255,0.9)",
  },
  statValue: {
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    fontSize: 20,
    marginTop: 6,
  },
  statValueLight: {
    color: Colors.WHITE,
  },
  statCaption: {
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    fontSize: 12,
    marginTop: 6,
  },
  statCaptionLight: {
    color: "rgba(255,255,255,0.85)",
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    // paddingVertical: 6,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.GREEN,
    borderColor: Colors.GREEN,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  filterTextActive: {
    color: Colors.WHITE,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyTitle: {
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    fontSize: 16,
    marginTop: 18,
    textAlign: "center",
  },
  emptyDescription: {
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: Colors.GREEN,
    borderRadius: 14,
    flexDirection: "row",
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: Colors.WHITE,
    fontFamily: "inter-medium",
    fontSize: 14,
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 120,
    paddingHorizontal: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
    marginBottom: 4,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  footerSpacer: {
    height: 40,
  },
  fab: {
    alignItems: "center",
    backgroundColor: Colors.GREEN,
    borderRadius: 28,
    bottom: 28,
    elevation: 5,
    height: 56,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    shadowColor: Colors.GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    width: 56,
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
    padding: 4,
    // paddingVertical: 3,
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: Colors.WHITE,
  },
  sortOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    // borderWidth: 1,
    // borderColor: "#E2E8F0",
    // marginRight: 8,
    // backgroundColor: Colors.WHITE,
    flex: 1,
  },
  sortOptionActive: {
    borderColor: Colors.GREEN,
    backgroundColor: "rgba(13, 148, 136, 0.12)",
    // add shadow for active sort option to make it floating
    boxShadow: `1px 1px 2px rgba(34, 39, 39, 0.3)`,
  },
  sortOptionText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY + "70",
    textAlign: "center",
  },
  sortOptionTextActive: {
    color: Colors.GREEN,
  },
});
