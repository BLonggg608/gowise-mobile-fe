import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type HotelDetails = {
  name?: string;
  address?: string;
  checkIn?: string;
  checkOut?: string;
  roomType?: string;
  rating?: string;
  ratingValue?: number;
  ratingCount?: number;
  priceText?: string;
  priceValue?: number;
  hotelClass?: string;
  type?: string;
  neighborhood?: string;
  distance?: string;
  currency?: string;
  amenities?: string[];
  description?: string;
  link?: string;
  mainImage?: {
    original?: string;
    thumbnail?: string;
  };
  images?: {
    original?: string;
    thumbnail?: string;
  }[];
};

type HotelTicketCardProps = {
  containerStyle?: StyleProp<ViewStyle>;
  hotelPrice: number;
  hotelDetails: HotelDetails | null;
  hasNoHotels: boolean;
  isLoading: boolean;
  errorMessage?: string | null;
  destinationLabel: string;
};

const formatCurrencyValue = (value: number) => {
  if (!value) return "$0";
  return `$${Math.max(value, 0).toLocaleString("en-US")}`;
};

const HotelTicketCard: React.FC<HotelTicketCardProps> = ({
  containerStyle,
  hotelPrice,
  hotelDetails,
  hasNoHotels,
  isLoading,
  errorMessage,
  destinationLabel,
}) => {
  const priceLabel =
    hotelDetails?.priceText ??
    (hotelDetails?.priceValue
      ? formatCurrencyValue(hotelDetails.priceValue)
      : null) ??
    (hotelPrice ? formatCurrencyValue(hotelPrice) : null);
  const ratingValue =
    hotelDetails?.ratingValue ??
    (hotelDetails?.rating ? Number(hotelDetails.rating) : undefined);
  const ratingRounded = ratingValue ? Math.round(ratingValue) : undefined;
  const previewImages = hotelDetails?.images?.slice(0, 3) ?? [];
  const hasExtraImages =
    (hotelDetails?.images?.length ?? 0) > previewImages.length;
  const mainImageUri =
    hotelDetails?.mainImage?.original || hotelDetails?.mainImage?.thumbnail;
  const openBookingLink = () => {
    const link = hotelDetails?.link;
    if (!link) return;
    Linking.canOpenURL(link).then((supported) => {
      if (supported) {
        Linking.openURL(link).catch(() => null);
      }
    });
  };

  return (
    <View style={[styles.sectionCard, containerStyle]}>
      {mainImageUri ? (
        <View style={styles.imageWrapper}>
          <Image
            resizeMode="cover"
            source={{ uri: mainImageUri }}
            style={styles.mainImage}
          />
          {hotelDetails?.type ? (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {hotelDetails.type.charAt(0).toUpperCase() +
                  hotelDetails.type.slice(1)}
              </Text>
            </View>
          ) : null}
          {previewImages.length > 0 ? (
            <View style={styles.previewRow}>
              {previewImages.map((image, index) => {
                const uri = image.thumbnail || image.original;
                if (!uri) return null;
                return (
                  <Image
                    key={`preview-${index}`}
                    source={{ uri }}
                    style={styles.previewImage}
                  />
                );
              })}
              {hasExtraImages ? (
                <View style={styles.previewMore}>
                  <Text style={styles.previewMoreText}>
                    +
                    {(hotelDetails?.images?.length ?? 0) - previewImages.length}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.headerRow}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionIcon}>
            <Ionicons color={Colors.GREEN} name="bed-outline" size={18} />
          </View>
          <Text style={styles.sectionTitle}>Available Hotels</Text>
        </View>
        {priceLabel ? (
          <Text style={styles.sectionMeta}>{priceLabel}</Text>
        ) : null}
      </View>

      {hotelDetails ? (
        <View>
          {hotelDetails.name ? (
            <Text style={styles.hotelName}>{hotelDetails.name}</Text>
          ) : null}
          {(ratingRounded || hotelDetails.ratingCount) && (
            <View style={styles.ratingRow}>
              <View style={styles.ratingStars}>
                {new Array(5).fill(null).map((_, index) => (
                  <Ionicons
                    key={`star-${index}`}
                    name={
                      ratingRounded && index < ratingRounded
                        ? "star"
                        : "star-outline"
                    }
                    size={14}
                    color={index < (ratingRounded ?? 0) ? "#FBBF24" : "#CBD5F5"}
                    style={styles.ratingStar}
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>
                {ratingValue ? ratingValue.toFixed(1) : hotelDetails.rating}
                {hotelDetails.ratingCount
                  ? ` (${hotelDetails.ratingCount})`
                  : ""}
              </Text>
            </View>
          )}

          {hotelDetails.neighborhood ||
          hotelDetails.address ||
          hotelDetails.distance ? (
            <View style={styles.locationBlock}>
              {hotelDetails.neighborhood ? (
                <Text style={styles.locationText}>
                  {hotelDetails.neighborhood}
                </Text>
              ) : null}
              {hotelDetails.address ? (
                <Text style={styles.locationSubText}>
                  {hotelDetails.address}
                </Text>
              ) : null}
              {hotelDetails.distance ? (
                <Text style={styles.locationSubText}>
                  {hotelDetails.distance}
                </Text>
              ) : null}
            </View>
          ) : null}

          {hotelDetails.amenities && hotelDetails.amenities.length > 0 ? (
            <View style={styles.amenitiesRow}>
              {hotelDetails.amenities.slice(0, 3).map((amenity) => (
                <View key={amenity} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
              {hotelDetails.amenities.length > 3 ? (
                <Text style={styles.moreAmenitiesText}>
                  +{hotelDetails.amenities.length - 3} more
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.sectionInfoGrid}>
            {hotelDetails.checkIn ? (
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Check-in</Text>
                <Text style={styles.infoValue}>{hotelDetails.checkIn}</Text>
              </View>
            ) : null}
            {hotelDetails.checkOut ? (
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Check-out</Text>
                <Text style={styles.infoValue}>{hotelDetails.checkOut}</Text>
              </View>
            ) : null}
            {hotelDetails.roomType ? (
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Room</Text>
                <Text style={styles.infoValue}>{hotelDetails.roomType}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              {hotelDetails.hotelClass ? (
                <Text style={styles.priceSubtitle}>
                  {hotelDetails.hotelClass}
                </Text>
              ) : null}
              <View style={styles.priceValueRow}>
                {priceLabel ? (
                  <Text style={styles.priceValueText}>{priceLabel}</Text>
                ) : (
                  <Text style={styles.priceValueText}>
                    {formatCurrencyValue(hotelPrice)}
                  </Text>
                )}
                <Text style={styles.priceSuffix}>per night</Text>
              </View>
            </View>
            {hotelDetails.link ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={openBookingLink}
                style={styles.bookButton}
              >
                <Text style={styles.bookButtonText}>Book now</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : hasNoHotels ? (
        <View style={styles.emptyInnerState}>
          <Ionicons color={Colors.GRAY} name="alert-circle-outline" size={28} />
          <Text style={styles.emptyInnerTitle}>No hotels available</Text>
          <Text style={styles.emptyInnerSubtitle}>
            {errorMessage ||
              `No hotels found in ${destinationLabel} for the selected dates.`}
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.emptyInnerState}>
          <ActivityIndicator color={Colors.GREEN} size="small" />
          <Text style={styles.emptyInnerSubtitle}>
            Loading hotel options...
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default HotelTicketCard;

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: Colors.WHITE,
    overflow: "hidden",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 16,
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
  hotelName: {
    fontSize: 18,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  ratingStar: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  locationBlock: {
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  locationSubText: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginTop: 2,
  },
  amenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  amenityChip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 11,
    fontFamily: "inter-medium",
    color: "#4338CA",
  },
  moreAmenitiesText: {
    fontSize: 11,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
    marginBottom: 8,
  },
  sectionInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  infoCell: {
    width: "48%",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginTop: 2,
  },
  priceRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  priceSubtitle: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
    marginBottom: 4,
  },
  priceValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceValueText: {
    fontSize: 22,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
  },
  priceSuffix: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    paddingBottom: 2,
  },
  bookButton: {
    backgroundColor: Colors.GREEN,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bookButtonText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
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
  imageWrapper: {
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  previewRow: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
  },
  previewImage: {
    width: 34,
    height: 34,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "#E2E8F0",
  },
  previewMore: {
    width: 34,
    height: 34,
    borderRadius: 6,
    marginLeft: 6,
    backgroundColor: "#0F172A99",
    alignItems: "center",
    justifyContent: "center",
  },
  previewMoreText: {
    fontSize: 11,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
  typeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: Colors.GREEN,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
    textTransform: "capitalize",
  },
});
