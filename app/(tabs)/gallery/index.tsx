import ImageDetailModal from "@/components/Gallery/ImageDetailModal";
import ImageUploadModal from "@/components/Gallery/ImageUploadModal";
import PhotoCard from "@/components/Gallery/PhotoCard";
import { Colors } from "@/constant/Colors";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import { getSecureData } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const statusBarHeight = Constants.statusBarHeight;

type GalleryItem = {
  id: string;
  imageUrl?: string;
  caption: string;
  location: string;
  photoCount?: number;
  totalLikes?: number;
};

type UploadResult = {
  success: boolean;
  count?: number;
};

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";

  if (!domain) {
    console.error("[GalleryScreen] Missing BE_DOMAIN configuration");
    return null;
  }

  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return port
    ? `${trimmedDomain}:${port}${normalizedPath}`
    : `${trimmedDomain}${normalizedPath}`;
};

const GalleryScreen = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchGalleries = useCallback(
    async ({ initial = false }: { initial?: boolean } = {}) => {
      if (initial) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const token = await getSecureData("accessToken");
        const userId = await getUserIdFromToken();

        if (!token || !userId) {
          console.error("[GalleryScreen] Missing access token or user id");
          setGalleries([]);
          return;
        }

        setCurrentUserId(userId);

        const endpoint = buildApiUrl(`/api/gallery/user/${userId}/galleries`);
        if (!endpoint) {
          setGalleries([]);
          return;
        }

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const reason = await response.text();
          console.error(
            `[GalleryScreen] Failed to fetch galleries (${response.status}): ${reason}`
          );
          setGalleries([]);
          return;
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          console.error("[GalleryScreen] Unexpected gallery payload", data);
          setGalleries([]);
          return;
        }

        const mapped: GalleryItem[] = data.map((item: Record<string, any>) => ({
          id: String(
            item.galleryId ??
              item.id ??
              `gallery-${Math.random().toString(36).slice(2)}`
          ),
          imageUrl: item.thumbnailUrl || item.imageUrl || undefined,
          caption:
            typeof item.caption === "string" && item.caption.trim().length > 0
              ? item.caption
              : `Bộ sưu tập ${item.photoCount ?? 0} ảnh`,
          location: typeof item.location === "string" ? item.location : "",
          photoCount:
            typeof item.photoCount === "number" ? item.photoCount : undefined,
          totalLikes:
            typeof item.totalLikes === "number" ? item.totalLikes : undefined,
        }));

        setGalleries(mapped);
      } catch (error) {
        console.error("[GalleryScreen] Error fetching galleries", error);
        setGalleries([]);
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

  useFocusEffect(
    useCallback(() => {
      fetchGalleries({ initial: true });
    }, [fetchGalleries])
  );

  const filteredGalleries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return galleries;
    return galleries.filter((gallery) => {
      const caption = gallery.caption.toLowerCase();
      const location = gallery.location.toLowerCase();
      return caption.includes(query) || location.includes(query);
    });
  }, [galleries, searchQuery]);

  const stats = useMemo(
    () => ({
      total: galleries.length,
      filtered: filteredGalleries.length,
    }),
    [galleries.length, filteredGalleries.length]
  );

  const handleOpenUpload = () => setShowUploadModal(true);
  const handleCloseUpload = () => setShowUploadModal(false);

  const handleUploadComplete = (result: UploadResult) => {
    if (result?.success) {
      fetchGalleries({ initial: true });
    }
    setShowUploadModal(false);
  };

  const handleGalleryPress = (gallery: GalleryItem) => {
    setSelectedGalleryId(gallery.id);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedGalleryId(null);
  };

  const renderGalleryGrid = () => {
    if (isLoading && galleries.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator color={Colors.GREEN} size="large" />
          <Text style={styles.stateText}>Đang tải kho ảnh...</Text>
        </View>
      );
    }

    if (filteredGalleries.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <View style={styles.stateIconWrapper}>
            <Ionicons color={Colors.GRAY} name="images-outline" size={40} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có ảnh nào</Text>
          <Text style={styles.emptyDescription}>
            Hãy tải lên những khoảnh khắc đáng nhớ của bạn.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenUpload}
            style={styles.primaryButton}
          >
            <Ionicons
              color={Colors.WHITE}
              name="cloud-upload-outline"
              size={18}
            />
            <Text style={styles.primaryButtonText}>Tải ảnh đầu tiên</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.grid}>
        {filteredGalleries.map((gallery) => (
          <PhotoCard
            key={gallery.id}
            caption={gallery.caption}
            containerStyle={styles.gridItem}
            imageUrl={gallery.imageUrl}
            location={gallery.location}
            onPress={() => handleGalleryPress(gallery)}
            photoCount={gallery.photoCount}
            totalLikes={gallery.totalLikes}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.title}>Kho kỉ niệm</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenUpload}
          style={styles.uploadButton}
        >
          <Ionicons color={Colors.WHITE} name="add-circle" size={18} />
          <Text style={styles.uploadButtonText}>Tạo kho ảnh</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            colors={[Colors.GREEN]}
            refreshing={isRefreshing}
            tintColor={Colors.GREEN}
            onRefresh={() => fetchGalleries({})}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Lưu giữ và chia sẻ những khoảnh khắc đáng nhớ
        </Text>
        {/* Stat */}
        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <View>
              <Text style={styles.statLabel}>Tổng số kho ảnh</Text>
              <Text style={styles.statValue}>{stats.total}</Text>
            </View>
            <View style={[styles.statIcon, styles.statIconTeal]}>
              <Ionicons color={Colors.GREEN} name="images" size={20} />
            </View>
          </View>
          <View style={styles.statCard}>
            <View>
              <Text style={styles.statLabel}>Đang hiển thị</Text>
              <Text style={[styles.statValue, styles.statValueBlue]}>
                {stats.filtered}
              </Text>
            </View>
            <View style={[styles.statIcon, styles.statIconBlue]}>
              <Ionicons color="#2563EB" name="search" size={20} />
            </View>
          </View>
        </View>

        {renderGalleryGrid()}

        {/* {filteredGalleries.length > 0 ? (
          <Text style={styles.summaryText}>
            Hiển thị {filteredGalleries.length} trong tổng số {stats.total} kho
            ảnh
          </Text>
        ) : null} */}
      </ScrollView>

      <ImageUploadModal
        onClose={handleCloseUpload}
        onUploadComplete={handleUploadComplete}
        visible={showUploadModal}
      />

      <ImageDetailModal
        galleryId={selectedGalleryId ?? ""}
        onClose={handleCloseDetail}
        userId={currentUserId ?? ""}
        visible={showDetailModal}
      />
    </View>
  );
};

export default GalleryScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headerSection: {
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
  title: {
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    fontSize: 22,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginVertical: 16,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.GREEN,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
  statGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    // alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginBottom: 6,
    width: "90%",
  },
  statValue: {
    fontSize: 22,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
  },
  statValueBlue: {
    color: "#2563EB",
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconTeal: {
    backgroundColor: "rgba(13, 148, 136, 0.12)",
  },
  statIconBlue: {
    backgroundColor: "rgba(37, 99, 235, 0.12)",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    marginBottom: 18,
  },
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  stateText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  stateIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "center",
    marginBottom: 18,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.GREEN,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  primaryButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
  summaryText: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
});
