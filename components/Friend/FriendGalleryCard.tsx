import { Colors } from "@/constant/Colors";
import { getSecureData } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "toastify-react-native";

type FriendProfile = {
  id: string;
  firstName: string;
  lastName: string;
  isPremium: boolean;
  city?: string;
};

type FriendGallery = {
  galleryId: string;
  thumbnailUrl: string;
  photoCount: number;
  totalLikes: number;
  location?: string;
};

type GalleryPhoto = {
  photoId: string;
  photoUrl: string;
};

type FriendGalleryCardProps = {
  friend: FriendProfile;
  gallery: FriendGallery;
};

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";
  if (!domain) {
    console.error("[FriendGalleryCard] Missing BE_DOMAIN configuration");
    return null;
  }
  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return port
    ? `${trimmedDomain}:${port}${normalizedPath}`
    : `${trimmedDomain}${normalizedPath}`;
};

const FriendGalleryCard: React.FC<FriendGalleryCardProps> = ({
  friend,
  gallery,
}) => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const initials = useMemo(() => {
    const first = friend.firstName?.trim().charAt(0) ?? "";
    const last = friend.lastName?.trim().charAt(0) ?? "";
    const combined = `${first}${last}`.toUpperCase();
    return combined || friend.id.slice(0, 2).toUpperCase();
  }, [friend.firstName, friend.id, friend.lastName]);

  const displayName = useMemo(() => {
    const first = friend.firstName?.trim() ?? "";
    const last = friend.lastName?.trim() ?? "";
    return `${first} ${last}`.trim() || "Người dùng";
  }, [friend.firstName, friend.lastName]);

  const currentPhotoUrl = useMemo(() => {
    if (photos.length > 0 && photos[currentIndex]?.photoUrl) {
      return photos[currentIndex].photoUrl;
    }
    return gallery.thumbnailUrl;
  }, [currentIndex, gallery.thumbnailUrl, photos]);

  const loadPhotos = useCallback(async () => {
    const endpoint = buildApiUrl(
      `/api/gallery/user/${friend.id}/trip/${gallery.galleryId}`
    );
    if (!endpoint) {
      Toast.show({
        type: "error",
        text1: "Thiếu cấu hình",
        text2: "Không xác định được máy chủ.",
      });
      return;
    }

    try {
      setIsLoading(true);
      const token = await getSecureData("accessToken");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Thiếu thông tin",
          text2: "Không tìm thấy token xác thực.",
        });
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
        throw new Error(
          reason || `Request failed with status ${response.status}`
        );
      }

      const payload = await response.json();
      const raw: unknown[] = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];

      const normalized = raw.reduce<GalleryPhoto[]>((acc, item) => {
        if (typeof item !== "object" || item === null) {
          return acc;
        }

        const source = item as Record<string, unknown>;
        const photoUrlRaw =
          source.fileUrl ??
          source.imageUrl ??
          source.photoUrl ??
          source.thumbnailUrl ??
          "";
        const photoIdRaw = source.photoId ?? source.id ?? source.uuid ?? "";

        const photoUrl =
          typeof photoUrlRaw === "string"
            ? photoUrlRaw
            : photoUrlRaw != null
            ? String(photoUrlRaw)
            : "";
        const photoId =
          typeof photoIdRaw === "string"
            ? photoIdRaw
            : photoIdRaw != null
            ? String(photoIdRaw)
            : "";

        if (!photoUrl) {
          return acc;
        }

        acc.push({
          photoId: photoId || `${gallery.galleryId}-${acc.length}`,
          photoUrl,
        });
        return acc;
      }, []);

      setPhotos(normalized);
      setCurrentIndex(0);
    } catch (error) {
      console.error("[FriendGalleryCard] fetch photos", error);
      Toast.show({
        type: "error",
        text1: "Không thể tải ảnh",
        text2:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi không xác định.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [friend.id, gallery.galleryId]);

  useEffect(() => {
    loadPhotos().catch((error) => {
      console.error("[FriendGalleryCard] loadPhotos error", error);
    });
  }, [loadPhotos]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      return nextIndex < photos.length ? nextIndex : prev;
    });
  }, [photos.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIndex = prev - 1;
      return nextIndex >= 0 ? nextIndex : prev;
    });
  }, []);

  const hasMultiplePhotos = photos.length > 1;
  const showPlaceholder = !currentPhotoUrl;
  const galleryLocation = useMemo(
    () => gallery.location?.trim() ?? "",
    [gallery.location]
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatarTeal}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.infoColumn}>
          <Text style={styles.nameText} numberOfLines={1}>
            {displayName}
          </Text>
          {friend.city ? (
            <View style={styles.metaRow}>
              <Ionicons color={Colors.GRAY} name="location-outline" size={14} />
              <Text style={styles.metaText} numberOfLines={1}>
                {friend.city}
              </Text>
            </View>
          ) : null}
        </View>
        {friend.isPremium ? (
          <View style={styles.premiumBadge}>
            <Ionicons color={Colors.WHITE} name="star" size={12} />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.galleryContainer}>
        {isLoading ? (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator color={Colors.GREEN} size="large" />
          </View>
        ) : showPlaceholder ? (
          <View style={styles.placeholder}>
            <Ionicons color={Colors.GRAY} name="image-outline" size={32} />
            <Text style={styles.placeholderText}>Không có ảnh</Text>
          </View>
        ) : (
          <Image
            source={{ uri: currentPhotoUrl }}
            style={styles.photo}
            resizeMode="cover"
          />
        )}

        {hasMultiplePhotos ? (
          <>
            <TouchableOpacity
              accessibilityLabel="Ảnh trước"
              activeOpacity={0.85}
              disabled={currentIndex === 0}
              onPress={handlePrev}
              style={[
                styles.navButton,
                styles.navLeft,
                currentIndex === 0 && styles.navDisabled,
              ]}
            >
              <Ionicons color={Colors.WHITE} name="chevron-back" size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Ảnh tiếp theo"
              activeOpacity={0.85}
              disabled={currentIndex === photos.length - 1}
              onPress={handleNext}
              style={[
                styles.navButton,
                styles.navRight,
                currentIndex === photos.length - 1 && styles.navDisabled,
              ]}
            >
              <Ionicons color={Colors.WHITE} name="chevron-forward" size={20} />
            </TouchableOpacity>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                {currentIndex + 1} / {photos.length}
              </Text>
            </View>
          </>
        ) : null}

        <View style={styles.photoCountBadge}>
          <Ionicons color={Colors.WHITE} name="images-outline" size={14} />
          <Text style={styles.photoCountText}>{gallery.photoCount}</Text>
        </View>
      </View>

      {galleryLocation ? (
        <View style={styles.locationRow}>
          <Ionicons color={Colors.GRAY} name="location-outline" size={14} />
          <Text style={styles.locationText} numberOfLines={1}>
            {galleryLocation}
          </Text>
        </View>
      ) : null}
      <View style={styles.footerRow}>
        <View style={styles.likeRow}>
          <Ionicons color="#F97316" name="heart" size={18} />
          <Text style={styles.likeText}>{gallery.totalLikes}</Text>
        </View>
        <Text style={styles.photoSummary}>{gallery.photoCount} ảnh</Text>
      </View>
    </View>
  );
};

export default FriendGalleryCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 14,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarTeal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.GREEN,
  },
  avatarText: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
  infoColumn: {
    flex: 1,
    gap: 4,
  },
  nameText: {
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
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.YELLOW,
    borderRadius: 999,
  },
  premiumText: {
    fontSize: 11,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
  galleryContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    height: 260,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  loaderOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  placeholderText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  navLeft: {
    left: 12,
  },
  navRight: {
    right: 12,
  },
  navDisabled: {
    opacity: 0.4,
  },
  counterBadge: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
  },
  counterText: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
  photoCountBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
  },
  photoCountText: {
    fontSize: 12,
    fontFamily: "inter-semibold",
    color: Colors.WHITE,
  },
  likeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  likeText: {
    fontSize: 13,
    fontFamily: "inter-semibold",
    color: "#F97316",
  },
  photoSummary: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
  },
});
