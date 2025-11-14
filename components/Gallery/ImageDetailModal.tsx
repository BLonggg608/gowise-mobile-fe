import { Colors } from "@/constant/Colors";
import { getSecureData } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type GalleryPhoto = {
  id: string;
  userId?: string;
  tripId?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  caption?: string;
  location?: string;
  likeCount?: number;
  takenAt?: string;
  uploadedAt?: string;
  isPublic?: boolean;
};

type ImageDetailModalProps = {
  visible: boolean;
  galleryId: string;
  userId: string;
  onClose: () => void;
};

const SLIDE_DURATION = 260;

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";

  if (!domain) {
    console.error("[ImageDetailModal] Missing BE_DOMAIN configuration");
    return null;
  }

  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return port
    ? `${trimmedDomain}:${port}${normalizedPath}`
    : `${trimmedDomain}${normalizedPath}`;
};

const formatDateTime = (value?: string) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const pickImageUrl = (photo: GalleryPhoto) =>
  photo.fileUrl || photo.imageUrl || photo.thumbnailUrl || "";

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  visible,
  galleryId,
  userId,
  onClose,
}) => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animation = useRef(new Animated.Value(1)).current;
  const containerWidth = useRef(Dimensions.get("window").width);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onClose();
        return true;
      }
    );
    return () => subscription.remove();
  }, [visible, onClose]);

  const resetAnimation = useCallback(() => {
    animation.stopAnimation();
    animation.setValue(1);
    setPrevIndex(null);
    setIsAnimating(false);
  }, [animation]);

  const prefetchImage = useCallback(
    async (index: number) => {
      const url = pickImageUrl(photos[index]);
      if (!url) return;
      try {
        await Image.prefetch(url);
      } catch {
        /* ignore */
      }
    },
    [photos]
  );

  const handleGoToIndex = useCallback(
    async (nextIndex: number) => {
      if (
        isAnimating ||
        nextIndex === currentIndex ||
        nextIndex < 0 ||
        nextIndex >= photos.length
      ) {
        return;
      }

      const dir = nextIndex > currentIndex ? 1 : -1;
      setIsAnimating(true);
      setPrevIndex(currentIndex);
      setDirection(dir);
      animation.stopAnimation();
      animation.setValue(0);

      await prefetchImage(nextIndex);

      setCurrentIndex(nextIndex);
      Animated.timing(animation, {
        toValue: 1,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        if (!mountedRef.current) return;
        setPrevIndex(null);
        setIsAnimating(false);
      });
    },
    [animation, currentIndex, isAnimating, photos.length, prefetchImage]
  );

  const handleNext = useCallback(() => {
    handleGoToIndex(currentIndex + 1);
  }, [currentIndex, handleGoToIndex]);

  const handlePrevious = useCallback(() => {
    handleGoToIndex(currentIndex - 1);
  }, [currentIndex, handleGoToIndex]);

  const loadPhotos = useCallback(async () => {
    if (!visible || !galleryId || !userId) return;
    setIsLoading(true);
    setError(null);
    setPhotos([]);
    setCurrentIndex(0);
    setPrevIndex(null);
    animation.setValue(1);

    try {
      const token = await getSecureData("accessToken");
      if (!token) {
        throw new Error("Missing authentication token");
      }

      const endpoint = buildApiUrl(
        `/api/gallery/user/${userId}/trip/${galleryId}`
      );

      if (!endpoint) {
        throw new Error("Missing endpoint configuration");
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
        throw new Error(reason || "Failed to fetch gallery photos");
      }

      const payload = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error("Unexpected gallery payload");
      }

      const mapped: GalleryPhoto[] = payload.map(
        (item: Record<string, any>) => ({
          id:
            String(
              item.id ||
                item.photoId ||
                item.uuid ||
                item.galleryPhotoId ||
                `photo-${Math.random().toString(36).slice(2)}`
            ) || "",
          userId: item.userId || item.user_id,
          tripId: item.tripId || item.trip_id,
          fileUrl:
            item.fileUrl ||
            item.file_url ||
            item.imageUrl ||
            item.url ||
            undefined,
          thumbnailUrl: item.thumbnailUrl || item.thumbnail_url || undefined,
          imageUrl: item.imageUrl || item.url || undefined,
          caption: item.caption || "",
          location: item.location || "",
          likeCount: item.likeCount || item.likes || 0,
          takenAt: item.takenAt || item.taken_at,
          uploadedAt: item.uploadedAt || item.uploaded_at,
          isPublic: item.isPublic ?? item.is_public ?? false,
        })
      );

      if (!mountedRef.current) return;
      setPhotos(mapped);
      setCurrentIndex(0);
      setPrevIndex(null);
    } catch (err) {
      console.error("[ImageDetailModal]", err);
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Không thể tải ảnh trong kho"
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [animation, galleryId, userId, visible]);

  useEffect(() => {
    if (visible) {
      loadPhotos();
    } else {
      resetAnimation();
      setPhotos([]);
      setError(null);
      setIsLoading(false);
    }
  }, [visible, loadPhotos, resetAnimation]);

  const currentPhoto = photos[currentIndex];
  const prevPhotoData = prevIndex !== null ? photos[prevIndex] : null;
  const canPrev = currentIndex > 0 && !isAnimating;
  const canNext = currentIndex < photos.length - 1 && !isAnimating;

  const dots = useMemo(() => photos.map((photo) => photo.id), [photos]);

  const handleOnLayout = useCallback((event: any) => {
    const width = event?.nativeEvent?.layout?.width;
    if (Number.isFinite(width)) {
      containerWidth.current = width;
    }
  }, []);

  const overlayContent = () => {
    if (isLoading) {
      return (
        <View style={styles.stateWrapper}>
          <ActivityIndicator color={Colors.GREEN} size="large" />
          <Text style={styles.stateText}>Đang tải ảnh...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateWrapper}>
          <Ionicons color={Colors.GRAY} name="alert-circle" size={40} />
          <Text style={styles.stateText}>{error}</Text>
        </View>
      );
    }

    if (!currentPhoto) {
      return (
        <View style={styles.stateWrapper}>
          <Ionicons color={Colors.GRAY} name="image-outline" size={40} />
          <Text style={styles.stateText}>Không có ảnh</Text>
        </View>
      );
    }

    return (
      <View style={styles.viewer} onLayout={handleOnLayout}>
        <View style={styles.detailHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.captionText}>
              {currentPhoto.caption || "Kho ảnh"}
            </Text>
            {currentPhoto.location ? (
              <View style={styles.locationRow}>
                <Ionicons
                  color={Colors.GRAY}
                  name="location-outline"
                  size={16}
                />
                <Text style={styles.locationText}>{currentPhoto.location}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Đóng"
          >
            <Ionicons color={Colors.WHITE} name="close" size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.imageArea}>
          {prevPhotoData ? (
            <Animated.Image
              source={{ uri: pickImageUrl(prevPhotoData) }}
              resizeMode="cover"
              style={[
                styles.image,
                {
                  transform: [
                    {
                      translateX: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          0,
                          direction === 1
                            ? -containerWidth.current
                            : containerWidth.current,
                        ],
                      }),
                    },
                  ],
                  opacity: animation.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [1, 0.4, 0],
                    extrapolate: "clamp",
                  }),
                },
              ]}
            />
          ) : null}

          <Animated.Image
            source={{ uri: pickImageUrl(currentPhoto) }}
            resizeMode="cover"
            style={[
              styles.image,
              {
                transform: [
                  {
                    translateX: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        direction === 1
                          ? containerWidth.current
                          : -containerWidth.current,
                        0,
                      ],
                    }),
                  },
                ],
              },
            ]}
          />

          {photos.length > 1 ? (
            <>
              <TouchableOpacity
                accessibilityLabel="Previous photo"
                disabled={!canPrev}
                onPress={handlePrevious}
                style={[
                  styles.navButton,
                  styles.navButtonLeft,
                  !canPrev && styles.navButtonDisabled,
                ]}
              >
                <Ionicons color={Colors.WHITE} name="chevron-back" size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityLabel="Next photo"
                disabled={!canNext}
                onPress={handleNext}
                style={[
                  styles.navButton,
                  styles.navButtonRight,
                  !canNext && styles.navButtonDisabled,
                ]}
              >
                <Ionicons
                  color={Colors.WHITE}
                  name="chevron-forward"
                  size={20}
                />
              </TouchableOpacity>

              <View style={styles.dotsWrapper}>
                {dots.map((id, index) => {
                  const isActive = index === currentIndex;
                  return (
                    <Pressable
                      key={id || `dot-${index}`}
                      accessibilityLabel={`Select photo ${index + 1}`}
                      onPress={() => handleGoToIndex(index)}
                      style={[styles.dot, isActive && styles.dotActive]}
                    >
                      {isActive ? <View style={styles.dotInner} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={styles.detailContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoBlock}>
            <View style={styles.infoRow}>
              <View style={styles.infoAvatar}>
                <Ionicons color={Colors.WHITE} name="person" size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Người dùng</Text>
                <Text style={styles.infoValue}>
                  {currentPhoto.userId || ""}
                </Text>
              </View>
            </View>

            {currentPhoto.caption ? (
              <Text style={styles.descriptionText}>{currentPhoto.caption}</Text>
            ) : null}

            {currentPhoto.takenAt ? (
              <Text style={styles.metaText}>
                Chụp: {formatDateTime(currentPhoto.takenAt)}
              </Text>
            ) : null}
            {currentPhoto.uploadedAt ? (
              <Text style={styles.metaText}>
                Tải lên: {formatDateTime(currentPhoto.uploadedAt)}
              </Text>
            ) : null}

            {typeof currentPhoto.likeCount === "number" ? (
              <View style={styles.detailBadgeRow}>
                <Ionicons color={Colors.GREEN} name="heart" size={16} />
                <Text style={styles.detailBadgeText}>
                  {currentPhoto.likeCount} lượt thích
                </Text>
              </View>
            ) : null}

            <View style={styles.divider} />

            {/* <Text style={styles.metaText}>
              Trạng thái: {currentPhoto.isPublic ? "Công khai" : "Riêng tư"}
            </Text> */}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalContainer}>{overlayContent()}</View>
      </View>
    </Modal>
  );
};

export default ImageDetailModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.WHITE,
    maxHeight: "90%",
  },
  viewer: {
    width: Dimensions.get("window").width - 32,
    maxWidth: 720,
    backgroundColor: Colors.WHITE,
  },
  imageArea: {
    position: "relative",
    width: "100%",
    aspectRatio: 3 / 2,
    backgroundColor: "#E2E8F0",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    // borderTopLeftRadius: 24,
    // borderTopRightRadius: 24,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    marginTop: -24,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  navButtonLeft: {
    left: 12,
  },
  navButtonRight: {
    right: 12,
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  dotsWrapper: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.7)",
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: {
    backgroundColor: Colors.WHITE,
  },
  dotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.GREEN,
  },
  detailContainer: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  detailHeader: {
    flexDirection: "row",
    // alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    marginBottom: 16,
  },
  captionText: {
    fontSize: 18,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginLeft: 4,
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  infoBlock: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  detailBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailBadgeText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  stateWrapper: {
    width: Dimensions.get("window").width - 32,
    maxWidth: 360,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
  },
  stateText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
    textAlign: "center",
  },
});
