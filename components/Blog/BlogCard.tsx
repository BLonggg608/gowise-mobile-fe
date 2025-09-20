import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type BlogType = {
  id: string;
  title: string;
  subtitle: string;
  image: any;
  readTime: string;
  date: string;
  likes: number;
  views: number;
};

const BlogCard = ({ blog }: { blog: BlogType }) => {
  return (
    <TouchableOpacity style={styles.card}>
      {/* Blog Image */}
      <Image source={blog.image} style={styles.cardImage} />

      {/* Blog Content */}
      <View style={styles.cardContent}>
        {/* Blog Header */}
        <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
          {blog.title}
        </Text>
        <Text
          style={styles.cardSubtitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {blog.subtitle}
        </Text>

        {/* Meta Info */}
        <View style={styles.metaContainer}>
          <View style={styles.cardMetaRow}>
            <Text style={styles.cardMeta}>
              <Ionicons name="time-outline" /> {blog.readTime}
            </Text>
            <Text style={styles.cardMeta}> • {blog.date}</Text>
          </View>
          <View style={styles.cardStatsRow}>
            <Text style={[styles.cardStat, { marginRight: 8 }]}>
              <Ionicons name="heart-outline" /> {blog.likes}
            </Text>
            <Text style={styles.cardStat}>
              <Ionicons name="eye-outline" /> {blog.views}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
  cardContent: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginBottom: 2,
  },
  cardSubtitle: {
    color: Colors.GRAY,
    fontSize: 14,
    fontFamily: "inter-regular",
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
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
});
