import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

export type MapModalMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  category?: string;
};

type MapModalProps = {
  visible: boolean;
  onClose: () => void;
  markers: MapModalMarker[];
  title?: string;
};

const DEFAULT_REGION: Region = {
  latitude: 21.028511,
  longitude: 105.804817,
  latitudeDelta: 0.3,
  longitudeDelta: 0.3,
};

const MapModal: React.FC<MapModalProps> = ({
  visible,
  onClose,
  markers,
  title,
}) => {
  const categoryPalette = useMemo(
    () => ["#FF3B30", "#34C759", "#007AFF", "#FF9500"],
    []
  );

  const region = useMemo<Region>(() => {
    if (markers.length === 0) {
      return DEFAULT_REGION;
    }

    const first = markers[0];
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15,
    };
  }, [markers]);

  const categoryColorMap = useMemo(() => {
    const mapping: Record<string, string> = {};
    let paletteIndex = 0;

    markers.forEach((marker) => {
      if (!marker.category) {
        return;
      }

      if (!(marker.category in mapping)) {
        const color = categoryPalette[paletteIndex] ?? categoryPalette[0];
        mapping[marker.category] = color;
        paletteIndex = Math.min(paletteIndex + 1, categoryPalette.length - 1);
      }
    });

    return mapping;
  }, [markers, categoryPalette]);

  const legendEntries = useMemo(() => {
    return Object.keys(categoryColorMap).map((category) => ({
      category,
      color: categoryColorMap[category],
    }));
  }, [categoryColorMap]);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons color={Colors.GREEN} name="map-outline" size={18} />
              <Text style={styles.headerTitle}>
                {title ?? "Bản đồ hành trình"}
              </Text>
              <Text style={styles.headerBadge}>{markers.length} điểm</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons color={Colors.GRAY} name="close" size={20} />
            </TouchableOpacity>
          </View>

          {legendEntries.length > 0 ? (
            <View style={styles.legendContainer}>
              {legendEntries.map((entry) => (
                <View key={entry.category} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: entry.color }]}
                  />
                  <Text style={styles.legendLabel}>{entry.category}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {markers.length > 0 ? (
            <MapView style={styles.map} initialRegion={region}>
              {markers.map((marker) => (
                <Marker
                  key={marker.id}
                  coordinate={{
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                  }}
                  pinColor={
                    categoryColorMap[marker.category ?? ""] ??
                    categoryPalette[0]
                  }
                  title={marker.title}
                  description={marker.description}
                />
              ))}
            </MapView>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons color={Colors.GRAY} name="location-outline" size={28} />
              <Text style={styles.emptyTitle}>Không có vị trí</Text>
              <Text style={styles.emptySubtitle}>
                Các hoạt động trong ngày này chưa có thông tin tọa độ để hiển
                thị bản đồ.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default MapModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  container: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    overflow: "hidden",
    height: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  headerBadge: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GREEN,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "center",
    lineHeight: 18,
  },
});
