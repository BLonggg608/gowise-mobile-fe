import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type PhotoCardProps = {
  imageUrl?: string;
  caption: string;
  location?: string;
  photoCount?: number;
  totalLikes?: number;
  containerStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

const PhotoCard: React.FC<PhotoCardProps> = ({
  imageUrl,
  caption,
  location,
  photoCount,
  totalLikes,
  containerStyle,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, containerStyle]}
    >
      <View style={styles.imageWrapper}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons color={Colors.WHITE} name="image-outline" size={30} />
          </View>
        )}
        <View style={styles.badgeRow}>
          {typeof photoCount === "number" ? (
            <View style={styles.badgePrimary}>
              <Ionicons color={Colors.WHITE} name="images-outline" size={14} />
              <Text style={styles.badgeText}>{photoCount}</Text>
            </View>
          ) : null}
          {typeof totalLikes === "number" ? (
            <View style={styles.badgeSecondary}>
              <Ionicons color={Colors.WHITE} name="heart" size={14} />
              <Text style={styles.badgeText}>{totalLikes}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.caption}>
          {caption}
        </Text>
        {location ? (
          <View style={styles.locationRow}>
            <Ionicons color={Colors.GRAY} name="location-outline" size={14} />
            <Text numberOfLines={1} style={styles.locationText}>
              {location}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export default PhotoCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  imageWrapper: {
    height: 150,
    backgroundColor: "#E2E8F0",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CBD5F5",
  },
  content: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  caption: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginLeft: 4,
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  badgeRow: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
  },
  badgePrimary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(13, 148, 136, 0.92)",
    marginRight: 8,
  },
  badgeSecondary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.9)",
  },
  badgeText: {
    marginLeft: 4,
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
});
