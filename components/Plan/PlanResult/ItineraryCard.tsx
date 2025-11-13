import { Colors } from "@/constant/Colors";
import MapModal, {
  MapModalMarker,
} from "@/components/Plan/PlanResult/MapModal";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  ViewStyle,
} from "react-native";

export type ItineraryActivity = {
  id: string;
  title: string;
  description?: string;
  timeOfDay?: string;
  time?: string;
  endTime?: string;
  timeRange?: string;
  durationText?: string;
  location?: string;
  address?: string;
  category?: string;
  cost?: string;
  ratingText?: string;
  ratingValue?: number;
  ratingCount?: number;
  notes?: string;
  contact?: string;
  bookingLink?: string;
  transportation?: string;
  additionalDetails?: string[];
  latitude?: number;
  longitude?: number;
};

export type ItineraryEntry = {
  id: string;
  dayNumber: number;
  date?: string;
  title?: string;
  summary?: string;
  activities: ItineraryActivity[];
};

type ItineraryCardProps = {
  containerStyle?: StyleProp<ViewStyle>;
  daysCount: number;
  items: ItineraryEntry[];
  errorMessage?: string | null;
  isLoading: boolean;
};

const ItineraryCard: React.FC<ItineraryCardProps> = ({
  containerStyle,
  daysCount,
  items,
  errorMessage,
  isLoading,
}) => {
  const dayOptions = useMemo(() => {
    const uniqueDays = Array.from(new Set(items.map((item) => item.dayNumber)));
    return uniqueDays.sort((a, b) => a - b);
  }, [items]);

  const [activeDay, setActiveDay] = useState<number | null>(
    dayOptions.length > 0 ? dayOptions[0] : null
  );

  useEffect(() => {
    if (dayOptions.length === 0) {
      setActiveDay(null);
      return;
    }

    setActiveDay((prev) =>
      prev !== null && dayOptions.includes(prev) ? prev : dayOptions[0]
    );
  }, [dayOptions]);

  const filteredItems = useMemo(() => {
    if (activeDay === null) {
      return items;
    }

    return items.filter((item) => item.dayNumber === activeDay);
  }, [activeDay, items]);

  const openLink = useCallback(async (url: string) => {
    if (!url) {
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.warn("[ItineraryCard] Unable to open url", url, error);
    }
  }, []);

  // const openMapAtCoordinates = useCallback(
  //   async (latitude?: number, longitude?: number) => {
  //     if (
  //       typeof latitude !== "number" ||
  //       typeof longitude !== "number" ||
  //       Number.isNaN(latitude) ||
  //       Number.isNaN(longitude)
  //     ) {
  //       return;
  //     }
  //     const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
  //     await openLink(url);
  //   },
  //   [openLink]
  // );

  // const formatCoordinate = useCallback((value?: number) => {
  //   if (typeof value !== "number" || Number.isNaN(value)) {
  //     return null;
  //   }
  //   return value.toFixed(4);
  // }, []);

  const formatBadge = (value?: string | null, shouldTitleCase = true) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!shouldTitleCase) {
      return trimmed;
    }
    if (/\d/.test(trimmed)) {
      return trimmed;
    }
    return trimmed
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatRating = (activity: ItineraryActivity) => {
    if (typeof activity.ratingValue === "number") {
      const rounded = Math.round(activity.ratingValue * 10) / 10;
      if (activity.ratingCount && activity.ratingCount > 0) {
        return `${rounded}/5 (${activity.ratingCount})`;
      }
      return `${rounded}/5`;
    }
    return activity.ratingText ?? null;
  };

  const [isMapVisible, setIsMapVisible] = useState(false);
  const [mapMarkers, setMapMarkers] = useState<MapModalMarker[]>([]);
  const [mapTitle, setMapTitle] = useState<string>("Bản đồ hành trình");

  const handleOpenMapForDay = useCallback((entry: ItineraryEntry) => {
    const markers = entry.activities
      .filter(
        (activity) =>
          typeof activity.latitude === "number" &&
          typeof activity.longitude === "number" &&
          !Number.isNaN(activity.latitude) &&
          !Number.isNaN(activity.longitude)
      )
      .map<MapModalMarker>((activity) => ({
        id: activity.id,
        latitude: activity.latitude as number,
        longitude: activity.longitude as number,
        title: activity.title,
        description: activity.location ?? activity.address,
        category: formatBadge(activity.category) ?? undefined,
      }));

    setMapMarkers(markers);
    setMapTitle(`Ngày ${entry.dayNumber}`);
    setIsMapVisible(true);
  }, []);

  const handleCloseMap = useCallback(() => {
    setIsMapVisible(false);
  }, []);

  return (
    <View style={[styles.sectionCard, containerStyle]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionIcon}>
            <Ionicons color={Colors.GREEN} name="calendar-outline" size={18} />
          </View>
          <Text style={styles.sectionTitle}>Your Travel Itinerary</Text>
        </View>
        <Text style={styles.sectionMeta}>
          {daysCount} day{daysCount !== 1 ? "s" : ""}
        </Text>
      </View>

      {items.length > 0 ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayTabsContent}
            style={styles.dayTabsContainer}
          >
            {dayOptions.map((dayNumber) => {
              const isActive = activeDay === dayNumber;
              return (
                <TouchableOpacity
                  key={`day-tab-${dayNumber}`}
                  onPress={() => setActiveDay(dayNumber)}
                  style={[
                    styles.dayTab,
                    isActive ? styles.dayTabActive : styles.dayTabInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayTabLabel,
                      isActive
                        ? styles.dayTabLabelActive
                        : styles.dayTabLabelInactive,
                    ]}
                  >
                    Day {dayNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {filteredItems.map((item) => (
            <View key={item.id} style={styles.itineraryBlock}>
              <View style={styles.itineraryHeaderRow}>
                <View style={styles.itineraryHeaderLeft}>
                  <Text style={styles.itineraryDayLabel}>
                    Day {item.dayNumber}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleOpenMapForDay(item)}
                  style={styles.mapButton}
                >
                  <Ionicons color={Colors.GREEN} name="map-outline" size={14} />
                  <Text style={styles.mapButtonText}>Xem Map</Text>
                </TouchableOpacity>
                {item.date ? (
                  <Text style={styles.itineraryDateText}>{item.date}</Text>
                ) : null}
              </View>
              {item.title ? (
                <Text style={styles.itineraryTitle}>{item.title}</Text>
              ) : null}
              {item.summary ? (
                <Text style={styles.itinerarySummary}>{item.summary}</Text>
              ) : null}

              {item.activities.length > 0 ? (
                item.activities.map((activity) => {
                  const badgeDay = formatBadge(activity.timeOfDay);
                  const timeBadge = formatBadge(activity.time, false);
                  const durationLabel = formatBadge(
                    activity.durationText,
                    false
                  );
                  const ratingLabel = formatRating(activity);

                  return (
                    <View key={activity.id} style={styles.activityCard}>
                      <View style={styles.activityHeaderRow}>
                        <View style={styles.activityHeaderText}>
                          <Text style={styles.activityTitle}>
                            {activity.title}
                          </Text>
                          <View style={styles.activityBadgeRow}>
                            {badgeDay ? (
                              <View style={styles.badge}>
                                <Text style={styles.badgeText}>{badgeDay}</Text>
                              </View>
                            ) : null}
                            {timeBadge ? (
                              <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                  {timeBadge}
                                </Text>
                              </View>
                            ) : null}
                            {activity.timeRange ? (
                              <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                  {formatBadge(activity.timeRange, false)}
                                </Text>
                              </View>
                            ) : null}
                            {durationLabel ? (
                              <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                  {durationLabel}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </View>

                      {activity.description ? (
                        <Text style={styles.activityDescription}>
                          {activity.description}
                        </Text>
                      ) : null}

                      <View style={styles.metaRow}>
                        {activity.location ? (
                          <View style={styles.metaItem}>
                            <Ionicons
                              color={Colors.GREEN}
                              name="location-outline"
                              size={14}
                              style={styles.metaIcon}
                            />
                            <Text style={styles.metaText}>
                              {activity.location}
                            </Text>
                          </View>
                        ) : null}
                        {activity.address ? (
                          <View style={styles.metaItem}>
                            <Ionicons
                              color={Colors.GRAY}
                              name="home-outline"
                              size={14}
                              style={styles.metaIcon}
                            />
                            <Text style={styles.metaText}>
                              {activity.address}
                            </Text>
                          </View>
                        ) : null}
                        {activity.transportation ? (
                          <View style={styles.metaItem}>
                            <Ionicons
                              color={Colors.GRAY}
                              name="walk-outline"
                              size={14}
                              style={styles.metaIcon}
                            />
                            <Text style={styles.metaText}>
                              {activity.transportation}
                            </Text>
                          </View>
                        ) : null}
                        {/* {typeof activity.latitude === "number" &&
                        typeof activity.longitude === "number" ? (
                          <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() =>
                              void openMapAtCoordinates(
                                activity.latitude,
                                activity.longitude
                              )
                            }
                            style={[
                              styles.metaItem,
                              styles.metaItemCoordinates,
                            ]}
                          >
                            <Ionicons
                              color={Colors.GREEN}
                              name="map-outline"
                              size={14}
                              style={styles.metaIcon}
                            />
                            <Text style={styles.metaText}>
                              {formatCoordinate(activity.latitude)},{" "}
                              {formatCoordinate(activity.longitude)}
                            </Text>
                          </TouchableOpacity>
                        ) : null} */}
                        {activity.cost ? (
                          <View style={styles.metaItem}>
                            <Ionicons
                              color={Colors.GREEN}
                              name="cash-outline"
                              size={14}
                              style={styles.metaIcon}
                            />
                            <Text style={styles.metaText}>{activity.cost}</Text>
                          </View>
                        ) : null}
                        {ratingLabel ? (
                          <View style={styles.metaItem}>
                            <Ionicons
                              color="#f97316"
                              name="star"
                              size={14}
                              style={styles.metaIcon}
                            />
                            <Text style={styles.metaText}>{ratingLabel}</Text>
                            {activity.category ? (
                              <View style={styles.categoryChip}>
                                <Text style={styles.categoryChipText}>
                                  {formatBadge(activity.category)}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        ) : null}
                      </View>

                      {activity.notes ? (
                        <View style={styles.noteContainer}>
                          <Ionicons
                            color={Colors.GREEN}
                            name="information-circle-outline"
                            size={16}
                            style={styles.metaIcon}
                          />
                          <Text style={styles.noteText}>{activity.notes}</Text>
                        </View>
                      ) : null}

                      {activity.contact ? (
                        <View style={styles.metaItem}>
                          <Ionicons
                            color={Colors.GRAY}
                            name="call-outline"
                            size={14}
                            style={styles.metaIcon}
                          />
                          <Text style={styles.metaText}>
                            {activity.contact}
                          </Text>
                        </View>
                      ) : null}

                      {activity.bookingLink ? (
                        <TouchableOpacity
                          accessibilityRole="link"
                          onPress={() => openLink(activity.bookingLink!)}
                          style={styles.linkRow}
                        >
                          <Ionicons
                            color={Colors.GREEN}
                            name="open-outline"
                            size={16}
                            style={styles.metaIcon}
                          />
                          <Text numberOfLines={1} style={styles.linkText}>
                            {activity.bookingLink}
                          </Text>
                        </TouchableOpacity>
                      ) : null}

                      {activity.additionalDetails &&
                      activity.additionalDetails.length > 0 ? (
                        <View style={styles.additionalDetails}>
                          {activity.additionalDetails.map(
                            (detail, detailIndex) => (
                              <Text
                                key={`${activity.id}-detail-${detailIndex}`}
                                style={styles.additionalDetailText}
                              >
                                • {detail}
                              </Text>
                            )
                          )}
                        </View>
                      ) : null}
                    </View>
                  );
                })
              ) : (
                <Text style={styles.itinerarySummary}>
                  No detailed activities available.
                </Text>
              )}
            </View>
          ))}
        </>
      ) : errorMessage ? (
        <View style={styles.emptyInnerState}>
          <Ionicons color={Colors.GRAY} name="alert-circle-outline" size={28} />
          <Text style={styles.emptyInnerTitle}>Unable to create itinerary</Text>
          <Text style={styles.emptyInnerSubtitle}>{errorMessage}</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.emptyInnerState}>
          <ActivityIndicator color={Colors.GREEN} size="small" />
          <Text style={styles.emptyInnerSubtitle}>Loading itinerary...</Text>
        </View>
      ) : (
        <View style={styles.emptyInnerState}>
          <Ionicons color={Colors.GRAY} name="calendar-outline" size={28} />
          <Text style={styles.emptyInnerTitle}>No itinerary data</Text>
          <Text style={styles.emptyInnerSubtitle}>
            We could not find any itinerary details for this plan.
          </Text>
        </View>
      )}

      <MapModal
        markers={mapMarkers}
        onClose={handleCloseMap}
        title={mapTitle}
        visible={isMapVisible}
      />
    </View>
  );
};

export default ItineraryCard;

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0F2F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  sectionMeta: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GREEN,
  },
  itineraryBlock: {
    // borderRadius: 12,
    // borderWidth: 1,
    // borderColor: "#E2E8F0",
    // padding: 14,
    marginBottom: 12,
    // backgroundColor: "#F8FAFC",
  },
  itineraryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  itineraryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  itineraryDayLabel: {
    fontSize: 14,
    fontFamily: "inter-bold",
    color: Colors.GREEN,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#E0F2F1",
  },
  mapButtonText: {
    fontSize: 11,
    fontFamily: "inter-medium",
    color: Colors.GREEN,
  },
  itineraryDateText: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  itineraryTitle: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  itinerarySummary: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  dayTabsContainer: {
    marginBottom: 12,
  },
  dayTabsContent: {
    paddingHorizontal: 2,
  },
  dayTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginRight: 10,
    borderWidth: 1,
  },
  dayTabInactive: {
    borderColor: "#E2E8F0",
    backgroundColor: Colors.WHITE,
  },
  dayTabActive: {
    borderColor: Colors.GREEN,
    backgroundColor: "#E0F2F1",
  },
  dayTabLabel: {
    fontSize: 13,
    fontFamily: "inter-medium",
  },
  dayTabLabelInactive: {
    color: Colors.GRAY,
  },
  dayTabLabelActive: {
    color: Colors.GREEN,
  },
  activityCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    // backgroundColor: "#FFF",
    backgroundColor: "#F8FAFC",
  },
  activityHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  activityHeaderText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  activityBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E0F2F1",
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "inter-medium",
    color: Colors.GREEN,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
  },
  categoryChipText: {
    fontSize: 11,
    fontFamily: "inter-medium",
    color: "#6366F1",
  },
  activityDescription: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  metaItemCoordinates: {
    justifyContent: "flex-start",
  },
  metaIcon: {
    marginTop: 1,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    maxWidth: 220,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  linkText: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GREEN,
    textDecorationLine: "underline",
    maxWidth: 240,
  },
  additionalDetails: {
    marginTop: 12,
    gap: 6,
  },
  additionalDetailText: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  emptyInnerState: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyInnerTitle: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  emptyInnerSubtitle: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "center",
  },
});
