import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

type FlightDetails = {
  airline?: string;
  route?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  flightNumber?: string;
  cabin?: string;
  priceText?: string;
  tripType?: string;
  airplane?: string;
  airlineLogo?: string;
  departureAirportCode?: string;
  departureAirportName?: string;
  arrivalAirportCode?: string;
  arrivalAirportName?: string;
  durationMinutes?: number;
  carbonDifferencePercent?: number;
  carbonKg?: number;
  legroom?: string;
  entertainment?: string;
};

type FlightTicketCardProps = {
  containerStyle?: StyleProp<ViewStyle>;
  flightPrice: number;
  flightDetails: FlightDetails | null;
  hasNoFlights: boolean;
  isLoading: boolean;
  errorMessage?: string | null;
  destinationLabel: string;
};

const formatCurrencyValue = (value: number) => {
  if (!value) return "$0";
  return `$${Math.max(value, 0).toLocaleString("en-US")}`;
};

const FlightTicketCard: React.FC<FlightTicketCardProps> = ({
  containerStyle,
  flightPrice,
  flightDetails,
  hasNoFlights,
  isLoading,
  errorMessage,
  destinationLabel,
}) => {
  const priceLabel = flightDetails?.priceText
    ? flightDetails.priceText
    : flightPrice
    ? formatCurrencyValue(flightPrice)
    : null;

  const formatTimeLabel = (value?: string) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return value;
  };

  const departureTime = formatTimeLabel(flightDetails?.departureTime);
  const arrivalTime = formatTimeLabel(flightDetails?.arrivalTime);
  const durationLabel =
    flightDetails?.duration ||
    (flightDetails?.durationMinutes
      ? `${flightDetails.durationMinutes} min`
      : undefined);
  const carbonText = (() => {
    if (
      typeof flightDetails?.carbonDifferencePercent === "number" &&
      typeof flightDetails?.carbonKg === "number"
    ) {
      const diff = flightDetails.carbonDifferencePercent;
      const prefix = diff > 0 ? "+" : diff < 0 ? "" : "±";
      return `${prefix}${diff}% emissions • ${flightDetails.carbonKg} kg`;
    }
    if (typeof flightDetails?.carbonKg === "number") {
      return `Estimated emissions • ${flightDetails.carbonKg} kg`;
    }
    return undefined;
  })();

  return (
    <View style={[styles.sectionCard, containerStyle]}>
      {flightDetails ? (
        <View>
          <View style={styles.headerRow}>
            <View style={styles.airlineBlock}>
              <View style={styles.airlineLogoWrapper}>
                {flightDetails.airlineLogo ? (
                  <Image
                    source={{ uri: flightDetails.airlineLogo }}
                    style={styles.airlineLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons color={Colors.GREEN} name="airplane" size={24} />
                )}
              </View>
              <View>
                {flightDetails.airline ? (
                  <Text style={styles.airlineName}>
                    {flightDetails.airline}
                  </Text>
                ) : null}
                {flightDetails.flightNumber || flightDetails.airplane ? (
                  <Text style={styles.airlineMeta}>
                    {[flightDetails.flightNumber, flightDetails.airplane]
                      .filter(Boolean)
                      .join(" • ")}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.priceBlock}>
              {priceLabel ? (
                <Text style={styles.priceText}>{priceLabel}</Text>
              ) : null}
              {flightDetails.tripType ? (
                <Text style={styles.priceCaption}>
                  {flightDetails.tripType}
                </Text>
              ) : null}
            </View>
          </View>

          {flightDetails.route ? (
            <Text style={styles.routeText}>{flightDetails.route}</Text>
          ) : null}

          <View style={styles.routeRow}>
            <View style={styles.airportColumn}>
              <Text style={styles.timeText}>
                {departureTime ?? flightDetails.departureTime}
              </Text>
              <Text style={styles.airportCode}>
                {flightDetails.departureAirportCode || "--"}
              </Text>
              {flightDetails.departureAirportName ? (
                <Text style={styles.airportName} numberOfLines={1}>
                  {flightDetails.departureAirportName}
                </Text>
              ) : null}
            </View>
            <View style={styles.pathColumn}>
              {durationLabel ? (
                <Text style={styles.durationText}>
                  Flight time: {durationLabel}
                </Text>
              ) : null}
              <View style={styles.pathTimeline}>
                <View style={styles.pathDot} />
                <View style={styles.pathLine} />
                <View style={styles.pathDot} />
              </View>
            </View>
            <View style={[styles.airportColumn, styles.airportColumnRight]}>
              <Text style={styles.timeText}>
                {arrivalTime ?? flightDetails.arrivalTime}
              </Text>
              <Text style={styles.airportCode}>
                {flightDetails.arrivalAirportCode || "--"}
              </Text>
              {flightDetails.arrivalAirportName ? (
                <Text
                  style={[styles.airportName, styles.airportNameRight]}
                  numberOfLines={1}
                >
                  {flightDetails.arrivalAirportName}
                </Text>
              ) : null}
            </View>
          </View>

          {(() => {
            const metaItems = [
              flightDetails.cabin,
              flightDetails.airplane,
            ].filter(Boolean);
            return metaItems.length > 0 ? (
              <View style={styles.metaRow}>
                {metaItems.map((item, index) => (
                  <Text key={index} style={styles.metaText}>
                    {index > 0 ? `• ${item}` : item}
                  </Text>
                ))}
              </View>
            ) : null;
          })()}

          {(flightDetails.legroom ||
            carbonText ||
            flightDetails.entertainment) && (
            <View style={styles.footerRow}>
              {flightDetails.legroom ? (
                <Text style={styles.footerText}>{flightDetails.legroom}</Text>
              ) : null}
              {carbonText ? (
                <Text style={[styles.footerText, styles.footerHighlight]}>
                  {carbonText}
                </Text>
              ) : null}
              {flightDetails.entertainment ? (
                <Text style={styles.footerText}>
                  {flightDetails.entertainment}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      ) : hasNoFlights ? (
        <View style={styles.emptyInnerState}>
          <Ionicons color={Colors.GRAY} name="alert-circle-outline" size={28} />
          <Text style={styles.emptyInnerTitle}>No flights available</Text>
          <Text style={styles.emptyInnerSubtitle}>
            {errorMessage ||
              `No flights found to ${destinationLabel} for the selected dates.`}
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.emptyInnerState}>
          <ActivityIndicator color={Colors.GREEN} size="small" />
          <Text style={styles.emptyInnerSubtitle}>
            Loading flight options...
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default FlightTicketCard;

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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  airlineBlock: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  airlineLogoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0F2F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  airlineLogo: {
    width: 32,
    height: 32,
  },
  airlineName: {
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  airlineMeta: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  priceBlock: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 18,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  priceCaption: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  routeText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
    marginBottom: 6,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
  },
  airportColumn: {
    flex: 1,
  },
  airportColumnRight: {
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 20,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
  },
  airportCode: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  airportName: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  airportNameRight: {
    textAlign: "right",
  },
  pathColumn: {
    flex: 1,
    alignItems: "center",
  },
  durationText: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
    marginBottom: 8,
  },
  pathTimeline: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  pathDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.GREEN,
  },
  pathLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.GREEN,
    marginHorizontal: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
    marginRight: 6,
  },
  footerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  footerText: {
    fontSize: 11,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
    marginRight: 8,
    marginTop: 4,
  },
  footerHighlight: {
    color: Colors.GREEN,
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
