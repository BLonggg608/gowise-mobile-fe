import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BlogListItem } from "./BlogCard";

type BlogDetailModalProps = {
  visible: boolean;
  post: BlogListItem | null;
  isLoading: boolean;
  isLiked: boolean;
  isLikeProcessing: boolean;
  onClose: () => void;
  onToggleLike: () => void;
};

const BlogDetailModal = ({
  visible,
  post,
  isLoading,
  isLiked,
  isLikeProcessing,
  onClose,
  onToggleLike,
}: BlogDetailModalProps) => {
  const normalizedContent = useMemo(() => {
    if (!post) return undefined;
    if (post.contentText && post.contentText.trim().length > 0) {
      return post.contentText.trim();
    }
    if (post.content && post.content.trim().length > 0) {
      return post.content
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
    if (post.summary && post.summary.trim().length > 0) {
      return post.summary.trim();
    }
    return undefined;
  }, [post]);

  const tags = post?.tags ?? [];

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {post?.title ?? "Chi tiết bài viết"}
            </Text>
            <View style={styles.headerSpacer} />
            <TouchableOpacity
              accessibilityLabel="Đóng chi tiết bài viết"
              accessibilityRole="button"
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.headerButton}
            >
              <Ionicons color={Colors.BLACK} name="close" size={22} />
            </TouchableOpacity>
          </View>

          {post?.thumbnailUrl ? (
            <Image
              source={{ uri: post.thumbnailUrl }}
              style={styles.coverImage}
            />
          ) : null}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.GREEN} size="large" />
              <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
            </View>
          ) : (
            <>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                style={styles.scroll}
              >
                <View style={styles.titleBlock}>
                  <Text style={styles.titleText}>{post?.title}</Text>
                  {post?.category ? (
                    <View style={styles.categoryChip}>
                      <Text numberOfLines={1} style={styles.categoryText}>
                        {post.category}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.metaRow}>
                  {post?.author ? (
                    <View style={styles.metaChip}>
                      <Ionicons
                        color={Colors.GRAY}
                        name="person-circle-outline"
                        size={16}
                        style={styles.metaIcon}
                      />
                      <Text numberOfLines={1} style={styles.metaText}>
                        {post.author}
                      </Text>
                    </View>
                  ) : null}
                  {post?.publishDateLabel ? (
                    <View style={styles.metaChip}>
                      <Ionicons
                        color={Colors.GRAY}
                        name="calendar-outline"
                        size={16}
                        style={styles.metaIcon}
                      />
                      <Text numberOfLines={1} style={styles.metaText}>
                        {post.publishDateLabel}
                      </Text>
                    </View>
                  ) : null}
                  {/* {post?.readTimeLabel ? (
										<View style={styles.metaChip}>
											<Ionicons
												color={Colors.GRAY}
												name="time-outline"
												size={16}
												style={styles.metaIcon}
											/>
											<Text numberOfLines={1} style={styles.metaText}>
												{post.readTimeLabel}
											</Text>
										</View>
									) : null} */}
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons
                      color={Colors.RED}
                      name={isLiked ? "heart" : "heart-outline"}
                      size={18}
                      style={styles.statIcon}
                    />
                    <Text style={styles.statText}>
                      {post?.likes ?? 0} lượt thích
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons
                      color={Colors.GRAY}
                      name="eye-outline"
                      size={18}
                      style={styles.statIcon}
                    />
                    <Text style={styles.statText}>
                      {post?.views ?? 0} lượt xem
                    </Text>
                  </View>
                </View>

                {tags.length > 0 ? (
                  <View style={styles.tagContainer}>
                    {tags.slice(0, 6).map((tag) => (
                      <View key={tag} style={styles.tagChip}>
                        <Text numberOfLines={1} style={styles.tagText}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {normalizedContent ? (
                  <Text style={styles.contentText}>{normalizedContent}</Text>
                ) : (
                  <Text style={styles.emptyContent}>
                    Nội dung chi tiết sẽ được cập nhật sau.
                  </Text>
                )}
              </ScrollView>

              <View style={styles.actionBar}>
                <TouchableOpacity
                  activeOpacity={0.82}
                  disabled={!post || isLikeProcessing}
                  onPress={onToggleLike}
                  style={[
                    styles.likeButton,
                    isLiked && styles.likeButtonActive,
                    (isLikeProcessing || !post) && styles.likeButtonDisabled,
                  ]}
                >
                  {isLikeProcessing ? (
                    <ActivityIndicator
                      color={isLiked ? Colors.WHITE : Colors.RED}
                      size="small"
                      style={styles.likeSpinner}
                    />
                  ) : (
                    <Ionicons
                      color={isLiked ? Colors.WHITE : Colors.RED}
                      name={isLiked ? "heart" : "heart-outline"}
                      size={18}
                      style={styles.likeIcon}
                    />
                  )}
                  <Text
                    style={[styles.likeText, isLiked && styles.likeTextActive]}
                  >
                    {isLiked ? "Bỏ thích" : "Thích bài viết"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default BlogDetailModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    overflow: "hidden",
    paddingBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerButton: {
    position: "absolute",
    alignContent: "center",
    right: 20,
    padding: 4,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "inter-medium",
    fontSize: 16,
    color: Colors.BLACK,
  },
  headerSpacer: {
    width: 28,
  },
  coverImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    fontSize: 14,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  titleBlock: {
    marginBottom: 18,
  },
  titleText: {
    fontFamily: "inter-medium",
    fontSize: 20,
    color: Colors.BLACK,
    marginBottom: 10,
  },
  categoryChip: {
    alignSelf: "flex-start",
    backgroundColor: "#E0F2FE",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontFamily: "inter-medium",
    fontSize: 12,
    color: Colors.GREEN,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontFamily: "inter-regular",
    fontSize: 12,
    color: Colors.GRAY,
    maxWidth: 140,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    marginRight: 6,
  },
  statText: {
    fontFamily: "inter-medium",
    fontSize: 13,
    color: Colors.BLACK,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  tagChip: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontFamily: "inter-regular",
    fontSize: 12,
    color: Colors.GRAY,
  },
  contentText: {
    fontFamily: "inter-regular",
    fontSize: 14,
    lineHeight: 22,
    color: Colors.BLACK,
    textAlign: "justify",
  },
  emptyContent: {
    fontFamily: "inter-regular",
    fontSize: 14,
    color: Colors.GRAY,
  },
  actionBar: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  likeButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.RED,
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
  },
  likeButtonActive: {
    backgroundColor: Colors.RED,
    borderColor: Colors.RED,
  },
  likeButtonDisabled: {
    opacity: 0.6,
  },
  likeIcon: {
    marginRight: 8,
  },
  likeSpinner: {
    marginRight: 8,
  },
  likeText: {
    fontFamily: "inter-medium",
    fontSize: 14,
    color: Colors.RED,
  },
  likeTextActive: {
    color: Colors.WHITE,
  },
});
