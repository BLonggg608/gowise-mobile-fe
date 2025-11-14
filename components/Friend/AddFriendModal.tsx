import { Colors } from "@/constant/Colors";
import { getSecureData } from "@/utils/storage";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "toastify-react-native";

type SearchUser = {
  id: string;
  firstName: string;
  lastName: string;
  isPremium: boolean;
  city?: string;
  createdAt?: string;
};

type AddFriendModalProps = {
  visible: boolean;
  onClose: () => void;
};

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";

  if (!domain) {
    console.error("[AddFriendModal] Missing BE_DOMAIN configuration");
    return null;
  }

  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return port
    ? `${trimmedDomain}:${port}${normalizedPath}`
    : `${trimmedDomain}${normalizedPath}`;
};

const AddFriendModal = ({ visible, onClose }: AddFriendModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setErrorMessage("");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const token = await getSecureData("accessToken");
      if (!token) {
        setErrorMessage("Vui lòng đăng nhập để tìm kiếm");
        setSearchResults([]);
        return;
      }

      const endpoint = buildApiUrl(
        `/users/search?name=${encodeURIComponent(query)}`
      );
      if (!endpoint) {
        setErrorMessage("Thiếu cấu hình máy chủ");
        return;
      }

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSearchResults(result.data || []);
      } else {
        setErrorMessage(result.message || "Có lỗi xảy ra khi tìm kiếm");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching friends:", error);
      setErrorMessage("Không thể kết nối đến server");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddFriend = useCallback(async (friendId: string) => {
    try {
      const token = await getSecureData("accessToken");
      if (!token) {
        setErrorMessage("Vui lòng đăng nhập để kết bạn");
        return;
      }

      const userId = await getUserIdFromToken();
      if (!userId) {
        setErrorMessage("Không thể xác định thông tin người dùng");
        return;
      }

      // Check if trying to add self
      if (userId === friendId) {
        Toast.show({
          type: "info",
          text1: "Không thể kết bạn",
          text2: "Bạn không thể kết bạn với chính mình",
        });
        setSearchResults((prev) => prev.filter((user) => user.id !== friendId));
        return;
      }

      const endpoint = buildApiUrl("/users/friends");
      if (!endpoint) {
        setErrorMessage("Thiếu cấu hình máy chủ");
        return;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userId,
          friendId: friendId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSearchResults((prev) => prev.filter((user) => user.id !== friendId));
        Toast.show({
          type: "success",
          text1: "Đã gửi lời mời kết bạn",
          text2: "Lời mời kết bạn đã được gửi thành công",
        });
      } else {
        if (
          result.error_code === "ALREADY_FRIENDS" ||
          (result.message &&
            result.message.toLowerCase().includes("already friends"))
        ) {
          Toast.show({
            type: "info",
            text1: "Đã là bạn bè",
            text2: "Hai bạn đã là bạn bè rồi",
          });
          setSearchResults((prev) =>
            prev.filter((user) => user.id !== friendId)
          );
        } else if (
          result.error_code === "REQUEST_PENDING" ||
          (result.message &&
            result.message.toLowerCase().includes("already sent"))
        ) {
          Toast.show({
            type: "info",
            text1: "Đã gửi lời mời",
            text2: "Lời mời kết bạn đã được gửi trước đó",
          });
          setSearchResults((prev) =>
            prev.filter((user) => user.id !== friendId)
          );
        } else {
          setErrorMessage(result.message || "Không thể gửi lời mời kết bạn");
        }
      }
    } catch (error) {
      console.error("Error adding friend:", error);
      setErrorMessage("Không thể kết nối đến server");
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setErrorMessage("");
  }, []);

  const renderUser = useCallback(
    ({ item }: { item: SearchUser }) => {
      const initials = item.firstName.charAt(0).toUpperCase();

      return (
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{initials}</Text>
            </View>
            <View style={styles.userDetails}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>
                  {item.firstName} {item.lastName}
                </Text>
                {item.isPremium ? (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="star" size={10} color={Colors.WHITE} />
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.userLocationRow}>
                {item.city ? (
                  <>
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color={Colors.GRAY}
                    />
                    <Text style={styles.userLocation}>{item.city}</Text>
                  </>
                ) : (
                  <Text style={styles.userLocation}>
                    Chưa cập nhật thành phố
                  </Text>
                )}
              </View>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleAddFriend(item.id)}
            style={styles.addButton}
          >
            <Ionicons
              name="person-add-outline"
              size={16}
              color={Colors.WHITE}
            />
            <Text style={styles.addButtonText}>Kết bạn</Text>
          </TouchableOpacity>
        </View>
      );
    },
    [handleAddFriend]
  );

  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={Colors.GREEN} size="large" />
          <Text style={styles.emptyStateText}>Đang tìm kiếm...</Text>
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.RED} />
          <Text style={[styles.emptyStateText, { color: Colors.RED }]}>
            {errorMessage}
          </Text>
        </View>
      );
    }

    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={Colors.GRAY} />
          <Text style={styles.emptyStateText}>Không tìm thấy kết quả</Text>
          <Text style={styles.emptyStateSubtext}>
            Thử tìm kiếm với từ khóa khác
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="people-outline" size={48} color={Colors.GRAY} />
        <Text style={styles.emptyStateText}>Tìm kiếm bạn bè</Text>
        <Text style={styles.emptyStateSubtext}>
          Nhập tên để bắt đầu tìm kiếm
        </Text>
      </View>
    );
  }, [errorMessage, isLoading, searchQuery]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="person-add" size={24} color={Colors.GREEN} />
              <Text style={styles.headerTitle}>Tìm bạn bè</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.GRAY} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchSection}>
            <View style={styles.searchInputWrapper}>
              <Ionicons
                name="search-outline"
                size={20}
                color={Colors.GRAY}
                style={styles.searchIcon}
              />
              <TextInput
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  handleSearch(text);
                }}
                placeholder="Tìm kiếm theo tên..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.GRAY} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Results */}
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderUser}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

export default AddFriendModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: Colors.WHITE,
    borderRadius: 24,
    width: "100%",
    maxHeight: "85%",
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginLeft: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
  },
  clearButton: {
    padding: 8,
    marginRight: 4,
  },
  resultsList: {
    padding: 16,
    flexGrow: 1,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
    marginRight: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatarText: {
    fontSize: 18,
    fontFamily: "inter-bold",
    color: Colors.WHITE,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  userName: {
    fontSize: 15,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    flexShrink: 1,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.YELLOW,
    borderRadius: 6,
    flexShrink: 0,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontFamily: "inter-bold",
    color: Colors.WHITE,
  },
  userLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userLocation: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.GREEN,
    borderRadius: 10,
    shadowColor: Colors.GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
    textAlign: "center",
  },
  emptyStateSubtext: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "center",
  },
});
