import { Colors } from "@/constant/Colors";
import { getSecureData } from "@/utils/storage";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "toastify-react-native";

type Friend = {
  id: string;
  firstName: string;
  lastName: string;
  isPremium: boolean;
  city?: string;
  createdAt?: string;
  bio?: string;
};

type FriendDetail = Friend;

type FriendCardProps = {
  friend: Friend;
  onFriendRemoved?: (friendId: string) => void;
};

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";

  if (!domain) {
    console.error("[FriendCard] Missing BE_DOMAIN configuration");
    return null;
  }

  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return port
    ? `${trimmedDomain}:${port}${normalizedPath}`
    : `${trimmedDomain}${normalizedPath}`;
};

const formatJoinedDate = (value?: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
};

const FriendCard: React.FC<FriendCardProps> = ({ friend, onFriendRemoved }) => {
  const [profileVisible, setProfileVisible] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState<FriendDetail | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

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

  const joinedDate = useMemo(
    () => formatJoinedDate(friend.createdAt),
    [friend.createdAt]
  );

  const handleCloseProfile = useCallback(() => {
    setProfileVisible(false);
    setProfileData(null);
  }, []);

  const handleViewProfile = useCallback(async () => {
    if (profileLoading) return;

    const endpoint = buildApiUrl(`/users/${friend.id}`);
    if (!endpoint) {
      Toast.show({
        type: "error",
        text1: "Thiếu cấu hình",
        text2: "Không xác định được máy chủ.",
      });
      return;
    }

    setProfileVisible(true);
    setProfileLoading(true);
    setProfileData(null);

    try {
      const token = await getSecureData("accessToken");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Thiếu thông tin",
          text2: "Không tìm thấy token xác thực.",
        });
        handleCloseProfile();
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
      const data = payload?.data ?? payload ?? {};

      setProfileData({
        id: String(data?.id ?? friend.id),
        firstName: data?.firstName ?? "",
        lastName: data?.lastName ?? "",
        bio: typeof data?.bio === "string" ? data.bio : undefined,
        isPremium: Boolean(data?.isPremium),
        city: data?.city ?? friend.city ?? "",
        createdAt: data?.createdAt ?? friend.createdAt,
      });
    } catch (error) {
      console.error("[FriendCard] handleViewProfile", error);
      Toast.show({
        type: "error",
        text1: "Không thể tải hồ sơ",
        text2:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi không xác định.",
      });
      handleCloseProfile();
    } finally {
      setProfileLoading(false);
    }
  }, [
    friend.city,
    friend.createdAt,
    friend.id,
    handleCloseProfile,
    profileLoading,
  ]);

  const executeRemoveFriend = useCallback(async () => {
    if (isRemoving) return;

    const endpoint = buildApiUrl("/users/friends");
    if (!endpoint) {
      Toast.show({
        type: "error",
        text1: "Thiếu cấu hình",
        text2: "Không xác định được máy chủ.",
      });
      return;
    }

    try {
      setIsRemoving(true);
      const token = await getSecureData("accessToken");
      const userId = await getUserIdFromToken();

      if (!token || !userId) {
        Toast.show({
          type: "error",
          text1: "Thiếu thông tin",
          text2: "Không thể xác định người dùng.",
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
          friend_id: friend.id,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload?.message || `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      onFriendRemoved?.(friend.id);
      setConfirmVisible(false);
    } catch (error) {
      console.error("[FriendCard] executeRemoveFriend", error);
      Toast.show({
        type: "error",
        text1: "Không thể xóa bạn",
        text2:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi không xác định.",
      });
    } finally {
      setIsRemoving(false);
    }
  }, [friend.id, isRemoving, onFriendRemoved]);

  const handleRemoveFriend = useCallback(() => {
    setConfirmVisible(true);
  }, []);

  const handleCancelRemove = useCallback(() => {
    if (isRemoving) return;
    setConfirmVisible(false);
  }, [isRemoving]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.infoColumn}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {displayName}
            </Text>
            {friend.isPremium ? (
              <View style={styles.premiumBadge}>
                <Ionicons color={Colors.WHITE} name="star" size={12} />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            ) : null}
          </View>

          {friend.city ? (
            <View style={styles.metaRow}>
              <Ionicons color={Colors.GRAY} name="location-outline" size={14} />
              <Text style={styles.metaText} numberOfLines={1}>
                {friend.city}
              </Text>
            </View>
          ) : null}

          {joinedDate ? (
            <Text style={styles.joinText} numberOfLines={1}>
              Bạn bè từ {joinedDate}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleViewProfile}
          style={styles.primaryButton}
          disabled={profileLoading}
        >
          {profileLoading ? (
            <ActivityIndicator color={Colors.WHITE} size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Xem trang</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRemoveFriend}
          style={styles.secondaryButton}
          disabled={isRemoving}
        >
          {isRemoving ? (
            <ActivityIndicator color={Colors.WHITE} size="small" />
          ) : (
            <Text style={styles.secondaryButtonText}>Xóa bạn</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={profileVisible}
        onRequestClose={handleCloseProfile}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              onPress={handleCloseProfile}
              style={styles.modalCloseBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color={Colors.BLACK} />
            </TouchableOpacity>

            {profileLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={Colors.GREEN} size="large" />
                <Text style={styles.modalLoadingText}>
                  Đang tải hồ sơ bạn bè...
                </Text>
              </View>
            ) : profileData ? (
              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {(profileData.firstName?.charAt(0) ?? "").toUpperCase()}
                      {(profileData.lastName?.charAt(0) ?? "").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.modalHeaderInfo}>
                    <Text style={styles.modalName}>
                      {profileData.firstName} {profileData.lastName}
                    </Text>
                    <Text style={styles.modalMembership}>
                      {profileData.isPremium
                        ? "Thành viên Premium"
                        : "Thành viên miễn phí"}
                    </Text>
                  </View>
                </View>

                {profileData.city ? (
                  <View style={styles.modalInfoBlock}>
                    <Text style={styles.modalLabel}>Thành phố</Text>
                    <Text style={styles.modalValue}>{profileData.city}</Text>
                  </View>
                ) : null}

                {profileData.bio ? (
                  <View style={styles.modalInfoBlock}>
                    <Text style={styles.modalLabel}>Giới thiệu</Text>
                    <Text style={styles.modalValue}>{profileData.bio}</Text>
                  </View>
                ) : null}

                {profileData.createdAt ? (
                  <View style={styles.modalInfoBlock}>
                    <Text style={styles.modalLabel}>Kết bạn từ</Text>
                    <Text style={styles.modalValue}>
                      {formatJoinedDate(profileData.createdAt)}
                    </Text>
                  </View>
                ) : null}
              </ScrollView>
            ) : (
              <View style={styles.modalLoading}>
                <Text style={styles.modalLoadingText}>
                  Không có dữ liệu hồ sơ để hiển thị.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={confirmVisible}
        onRequestClose={handleCancelRemove}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, styles.confirmContainer]}>
            <Text style={styles.confirmTitle}>Xóa bạn bè</Text>
            <Text style={styles.confirmMessage}>
              Bạn có chắc muốn xóa {displayName} khỏi danh sách bạn bè?
            </Text>
            <View style={styles.confirmButtonRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={handleCancelRemove}
                activeOpacity={0.85}
                disabled={isRemoving}
              >
                <Text style={styles.confirmCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={executeRemoveFriend}
                activeOpacity={0.85}
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <ActivityIndicator color={Colors.WHITE} size="small" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Xóa</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FriendCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    gap: 16,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.GREEN,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: "inter-bold",
    color: Colors.WHITE,
  },
  infoColumn: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameText: {
    fontSize: 18,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
    flexShrink: 1,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.YELLOW,
  },
  premiumText: {
    fontSize: 11,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
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
  joinText: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: Colors.WHITE,
    fontFamily: "inter-semibold",
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.RED,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: Colors.WHITE,
    fontFamily: "inter-semibold",
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "center",
    padding: 18,
  },
  modalContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  confirmContainer: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    gap: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontFamily: "inter-semibold",
    color: Colors.BLACK,
  },
  confirmMessage: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    lineHeight: 20,
  },
  confirmButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  confirmCancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  confirmCancelText: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  confirmDeleteBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.RED,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  confirmDeleteText: {
    fontSize: 14,
    fontFamily: "inter-semibold",
    color: Colors.WHITE,
  },
  modalCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  modalLoading: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  modalLoadingText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
    textAlign: "center",
  },
  modalScrollContent: {
    paddingTop: 20,
    paddingBottom: 4,
    gap: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatarText: {
    color: Colors.WHITE,
    fontFamily: "inter-bold",
    fontSize: 22,
  },
  modalHeaderInfo: {
    flex: 1,
    gap: 6,
  },
  modalName: {
    fontSize: 20,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
  },
  modalMembership: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  modalInfoBlock: {
    gap: 6,
  },
  modalLabel: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  modalValue: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
    lineHeight: 20,
  },
});
