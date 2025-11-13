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

          {markers.length > 0 ? (
            <MapView style={styles.map} initialRegion={region}>
              {markers.map((marker) => (
                <Marker
                  key={marker.id}
                  coordinate={{
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                  }}
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
