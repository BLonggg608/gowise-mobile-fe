import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type FriendProfile = {
  id: string;
  firstName: string;
  lastName: string;
  isPremium: boolean;
  city?: string;
};

type FriendPost = {
  postId: string;
  title: string;
  content: string;
  category: string;
  totalLikes: number;
  totalViews: number;
  publishedAt?: string;
};

type FriendPostCardProps = {
  friend: FriendProfile;
  post: FriendPost;
};

const formatNumber = (value: number) => {
  if (value >= 1000) {
    const shortened = (value / 1000).toFixed(1);
    return `${shortened.endsWith(".0") ? shortened.slice(0, -2) : shortened}k`;
  }
  return value.toString();
};

const formatDate = (value?: string) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).format(date);
  } catch (error) {
    console.error("[FriendPostCard] formatDate error", error);
    return "";
  }
};

const getPreviewContent = (content: string, maxLength = 200) => {
  const normalized = content?.trim() ?? "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
};

const FriendPostCard: React.FC<FriendPostCardProps> = ({ friend, post }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleToggleContent = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const renderedContent = useMemo(() => {
    if (isExpanded) {
      return post.content;
    }
    return getPreviewContent(post.content);
  }, [isExpanded, post.content]);

  const publishDate = useMemo(
    () => formatDate(post.publishedAt),
    [post.publishedAt]
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatarPurple}>
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

      <View style={styles.contentContainer}>
        <Text style={styles.postTitle}>{post.title}</Text>
        {post.category ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{post.category}</Text>
          </View>
        ) : null}
        <Text
          style={styles.postContent}
          numberOfLines={isExpanded ? undefined : 2}
        >
          {renderedContent}
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleToggleContent}
          style={styles.toggleButton}
        >
          <View style={styles.toggleLabelRow}>
            <Text style={styles.toggleText}>
              {isExpanded ? "Thu gọn" : "Xem thêm"}
            </Text>
            <Ionicons
              color={Colors.GREEN}
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={14}
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerLeft}>
          {publishDate ? (
            <View style={styles.footerItem}>
              <Ionicons color={Colors.GRAY} name="time-outline" size={13} />
              <Text style={styles.footerItemText}>{publishDate}</Text>
            </View>
          ) : null}
          <View style={styles.footerItem}>
            <Ionicons color={Colors.GRAY} name="eye-outline" size={13} />
            <Text style={styles.footerItemText}>
              {formatNumber(post.totalViews)}
            </Text>
          </View>
        </View>

        <View style={styles.footerItem}>
          <Ionicons color="#F97316" name="heart" size={16} />
          <Text style={styles.likesText}>{formatNumber(post.totalLikes)}</Text>
        </View>
      </View>
    </View>
  );
};

export default FriendPostCard;

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
  avatarPurple: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
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
  contentContainer: {
    gap: 10,
  },
  postTitle: {
    fontSize: 18,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#CCFBF1",
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "inter-medium",
    color: Colors.GREEN,
  },
  postContent: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
    lineHeight: 20,
  },
  toggleButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  toggleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GREEN,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerItemText: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  likesText: {
    fontSize: 13,
    fontFamily: "inter-semibold",
    color: "#F97316",
  },
});
