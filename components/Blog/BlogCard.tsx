import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type BlogListItem = {
  id: string;
  title: string;
  summary?: string;
  thumbnailUrl?: string;
  relativeTime?: string;
  createdLabel?: string;
  createdValue?: number;
  likes?: number;
  views?: number;
  statusLabel?: string;
  statusValue?: string;
  tags?: string[];
  category?: string;
  categoryValue?: string;
  author?: string;
  publishDateLabel?: string;
  readTimeLabel?: string;
  content?: string;
  contentText?: string;
  raw?: Record<string, unknown>;
};

type BlogCardProps = {
  blog: BlogListItem;
  onPress?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
};

const BlogCard = ({ blog, onPress, onDelete, isDeleting }: BlogCardProps) => {
  const WrapperComponent = (
    <>
      <View style={styles.cardImageWrapper}>
        {blog.thumbnailUrl ? (
          <Image source={{ uri: blog.thumbnailUrl }} style={styles.cardImage} />
        ) : (
          // <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          //   <Ionicons color={Colors.GRAY} name="image-outline" size={38} />
          // </View>
          <Image
            source={require("@/assets/images/PlanImage/3.jpg")}
            style={styles.cardImage}
          />
        )}

        {blog.category ? (
          <View style={styles.categoryBadge}>
            <Text numberOfLines={1} style={styles.categoryText}>
              {blog.category}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text ellipsizeMode="tail" numberOfLines={1} style={styles.cardTitle}>
            {blog.title}
          </Text>
        </View>

        {blog.summary ? (
          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            style={styles.cardSubtitle}
          >
            {blog.summary}
          </Text>
        ) : null}

        {blog.tags && blog.tags.length > 0 ? (
          <View style={styles.tagRow}>
            {blog.tags.slice(0, 3).map((tag) => (
              <View key={`${blog.id}-${tag}`} style={styles.tagChip}>
                <Text numberOfLines={1} style={styles.tagText}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.metaContainer}>
          <Text style={styles.cardMeta}>
            <Ionicons color={Colors.GRAY} name="time-outline" size={14} />{" "}
            {blog.createdLabel ?? blog.relativeTime ?? "Không rõ"}
          </Text>
          <View style={styles.cardStatsRow}>
            <Text style={[styles.cardStat, styles.cardStatSpacing]}>
              <Ionicons color={Colors.GRAY} name="heart-outline" size={14} />{" "}
              {blog.likes ?? 0}
            </Text>
            <Text style={styles.cardStat}>
              <Ionicons color={Colors.GRAY} name="eye-outline" size={14} />{" "}
              {blog.views ?? 0}
            </Text>
          </View>
        </View>

        {blog.statusLabel || onDelete ? (
          <View style={styles.BottomRow}>
            {/* {blog.statusLabel ? (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{blog.statusLabel}</Text>
              </View>
            ) : null} */}

            {onDelete ? (
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={isDeleting}
                onPress={onDelete}
                style={[
                  styles.deleteButton,
                  isDeleting && styles.deleteButtonDisabled,
                ]}
              >
                {isDeleting ? (
                  <>
                    <ActivityIndicator
                      color={Colors.RED}
                      size="small"
                      style={styles.deleteSpinner}
                    />
                    <Text style={styles.deleteButtonText}> Đang xoá...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      color={Colors.RED}
                      name="trash-outline"
                      size={18}
                    />
                    <Text style={styles.deleteButtonText}>Xoá</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    </>
  );

  return onPress ? (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={styles.card}
    >
      {WrapperComponent}
    </TouchableOpacity>
  ) : (
    <View style={styles.card}>{WrapperComponent}</View>
  );
};

export default BlogCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    marginBottom: 18,
    overflow: "hidden",
    elevation: 2,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  cardImageWrapper: {
    position: "relative",
  },
  cardImagePlaceholder: {
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
  },
  categoryBadge: {
    position: "absolute",
    // top: 10,
    // right: 10,
    backgroundColor: Colors.WHITE,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
    marginRight: 10,
    zIndex: 2,
    alignSelf: "flex-end",
  },
  categoryText: {
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    fontSize: 12,
    textTransform: "capitalize",
  },
  cardContent: {
    padding: 14,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  BottomRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    marginTop: 6,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.RED + "20",
    padding: 4,
    borderRadius: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteSpinner: {
    marginRight: 4,
  },
  deleteButtonText: {
    color: Colors.RED,
    marginLeft: 6,
    fontSize: 13,
    fontFamily: "inter-medium",
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginBottom: 2,
    flex: 1,
  },
  cardSubtitle: {
    color: Colors.GRAY,
    fontSize: 14,
    fontFamily: "inter-regular",
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: Colors.GREEN,
    fontFamily: "inter-medium",
    fontSize: 11,
    textTransform: "uppercase",
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  cardMeta: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  cardStatsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardStat: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  cardStatSpacing: {
    marginRight: 12,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  tagChip: {
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    marginBottom: 6,
    marginRight: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    fontSize: 12,
  },
});
