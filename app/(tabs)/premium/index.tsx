import { Colors } from "@/constant/Colors";
import { saveData } from "@/utils/localStorage";
import { getSecureData } from "@/utils/storage";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import {
  RelativePathString,
  useLocalSearchParams,
  useRouter,
  useFocusEffect,
} from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "toastify-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PLAN_NAME = "Gói Premium Gowise";
const PLAN_DESCRIPTION =
  "Truy cập đầy đủ trợ lý du lịch AI, cảnh báo thời tiết và hỗ trợ ưu tiên trong 30 ngày.";
const MAX_DESCRIPTION_LENGTH = 25;
const PAYOS_DESCRIPTION = "Gowise Premium";
const USER_CACHE_KEY = "gowise:user-data";

type PremiumParams = {
  status?: string | string[];
  orderCode?: string | string[];
  order_code?: string | string[];
  cancel?: string | string[];
  code?: string | string[];
  id?: string | string[];
};

type PayOSPayload = {
  data?: Record<string, unknown> | null;
  checkoutUrl?: string;
  checkout_url?: string;
  redirectUrl?: string;
  redirect_url?: string;
  payload?: { checkoutUrl?: string; checkout_url?: string } | null;
};

type PremiumOption = {
  duration: number; // số tháng
  priceUSD: string;
  priceVND: number;
  label: string;
  endpoint?: string;
};

const FEATURE_LIST = [
  "Lịch trình AI không giới hạn",
  "Cá nhân hóa nâng cao",
  "Cập nhật lịch trình thời gian thực",
  "Điểm đến & trải nghiệm cao cấp",
  "Hỗ trợ khách hàng ưu tiên",
  "Truy cập ngoại tuyến",
  "Lập kế hoạch du lịch nhóm",
  "Tối ưu hóa ngân sách",
  "Gợi ý từ người địa phương",
  "Tích hợp bảo hiểm du lịch",
];

const PREMIUM_OPTIONS: PremiumOption[] = [
  {
    duration: 1,
    priceUSD: "~1.99 USD / tháng",
    priceVND: 52397,
    label: "Gói 1 tháng",
    endpoint: "/api/payos/payment-link",
  },
  {
    duration: 6,
    priceUSD: "~11.99 USD / 6 tháng",
    priceVND: 314380,
    label: "Gói 6 tháng",
    endpoint: "/api/payos/payment-link/premium",
  },
  {
    duration: 12,
    priceUSD: "~23.99 USD / năm",
    priceVND: 628760,
    label: "Gói 1 năm",
    endpoint: "/api/payos/payment-link/enterprise",
  },
];

const trimTrailingSlash = (value?: string | null) => {
  if (!value) return "";
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const buildBackendBaseUrl = () => {
  const domain = trimTrailingSlash(Constants.expoConfig?.extra?.env?.BE_DOMAIN);
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";

  if (!domain) {
    return "http://localhost:8080";
  }

  const hasProtocol =
    domain.startsWith("http://") || domain.startsWith("https://");
  const normalized = hasProtocol ? domain : `http://${domain}`;

  return port ? `${normalized}:${port}` : normalized;
};

const sanitizeDescription = (value?: string | null) => {
  if (!value) return "";
  return value.trim().slice(0, MAX_DESCRIPTION_LENGTH);
};

const extractSingleParam = (value?: string | string[]) => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const resolveCheckoutUrl = (payload: PayOSPayload | null | undefined) => {
  if (!payload) return null;
  if (typeof payload.checkoutUrl === "string") return payload.checkoutUrl;
  if (typeof payload.checkout_url === "string") return payload.checkout_url;
  if (typeof payload.redirectUrl === "string") return payload.redirectUrl;
  if (typeof payload.redirect_url === "string") return payload.redirect_url;
  if (payload.data && typeof payload.data === "object") {
    const nested = payload.data as Record<string, unknown>;
    if (typeof nested.checkoutUrl === "string") return nested.checkoutUrl;
    if (typeof nested.checkout_url === "string") return nested.checkout_url;
  }
  if (payload.payload && typeof payload.payload === "object") {
    const nested = payload.payload;
    if (typeof nested.checkoutUrl === "string") return nested.checkoutUrl;
    if (typeof nested.checkout_url === "string") return nested.checkout_url;
  }
  return null;
};

const PremiumScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<PremiumParams>();

  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [awaitingUpgradeAfterLogin, setAwaitingUpgradeAfterLogin] =
    useState(false);

  const backendBaseUrl = useMemo(() => buildBackendBaseUrl(), []);
  const paymentEndpoint = useMemo(
    () => `${backendBaseUrl}/api/payos/payment-link`,
    [backendBaseUrl]
  );

  const payOSReturnUrl = useMemo(() => {
    // Kiểm tra nếu đang chạy trên Expo Go
    const isExpoGo = Constants.appOwnership === "expo";

    if (isExpoGo) {
      // Dùng Expo deep-link cho Expo Go
      // Format: exp://192.168.x.x:8081/--/premium?status=success
      const experienceUrl = Constants.expoConfig?.hostUri
        ? `exp://${Constants.expoConfig.hostUri}`
        : "exp://";
      return `${experienceUrl}/--/premium?status=success`;
    } else {
      // Dùng custom scheme cho standalone app
      const scheme = Constants.expoConfig?.scheme ?? "gowise";
      return `${scheme}://premium?status=success`;
    }
  }, []);

  const payOSCancelUrl = useMemo(() => {
    // Kiểm tra nếu đang chạy trên Expo Go
    const isExpoGo = Constants.appOwnership === "expo";

    if (isExpoGo) {
      // Dùng Expo deep-link cho Expo Go
      const experienceUrl = Constants.expoConfig?.hostUri
        ? `exp://${Constants.expoConfig.hostUri}`
        : "exp://";
      return `${experienceUrl}/--/premium?status=cancel`;
    } else {
      // Dùng custom scheme cho standalone app
      const scheme = Constants.expoConfig?.scheme ?? "gowise";
      return `${scheme}://premium?status=cancel`;
    }
  }, []);

  const cacheUserProfile = useCallback(
    async (data: Record<string, unknown> | null) => {
      try {
        if (data) {
          await saveData({ key: USER_CACHE_KEY, value: data });
        } else {
          await saveData({ key: USER_CACHE_KEY, value: null });
        }
      } catch (error) {
        console.warn("[PremiumScreen] cache user profile error", error);
      }
    },
    []
  );

  const fetchUserProfile = useCallback(
    async (token: string, userId: string) => {
      const endpoint = `${backendBaseUrl}/users/${userId}`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let payload: any = null;
      try {
        payload = await response.json();
      } catch (parseError) {
        console.warn("[PremiumScreen] profile parse error", parseError);
      }

      if (!response.ok) {
        const message =
          payload?.message ||
          payload?.error ||
          `Không thể lấy thông tin người dùng (HTTP ${response.status})`;
        throw new Error(message);
      }

      const data = payload?.data ?? payload;
      if (!data) {
        throw new Error("Không nhận được thông tin người dùng.");
      }

      return data as Record<string, unknown>;
    },
    [backendBaseUrl]
  );

  const markUserAsPremium = useCallback(
    async (token: string, userId: string) => {
      const endpoint = `${backendBaseUrl}/users/${userId}/is_premium`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPremium: true }),
      });

      let payload: any = null;
      try {
        payload = await response.json();
      } catch (parseError) {
        console.warn("[PremiumScreen] mark premium parse error", parseError);
      }

      if (!response.ok || payload?.success === false) {
        const message =
          payload?.message ||
          payload?.error ||
          `Không thể cập nhật tài khoản (HTTP ${response.status})`;
        throw new Error(message);
      }
    },
    [backendBaseUrl]
  );

  const clearStatusParams = useCallback(() => {
    router.replace("/(tabs)/premium/index" as RelativePathString);
  }, [router]);

  const finalizeSuccessfulPayment = useCallback(
    async (orderCode?: string | null, existingToken?: string | null) => {
      if (isProcessingReturn) return;

      const token = existingToken ?? (await getSecureData("accessToken"));
      if (!token) {
        setAwaitingUpgradeAfterLogin(true);
        setStatusMessage("Vui lòng đăng nhập lại để hoàn tất nâng cấp.");
        Toast.show({
          type: "info",
          text1: "Cần đăng nhập",
          text2: "Đăng nhập để hoàn tất kích hoạt Premium.",
        });
        router.push("/auth/sign-in");
        return;
      }

      const userId = await getUserIdFromToken();
      if (!userId) {
        setStatusMessage(
          "Không xác định được tài khoản. Vui lòng đăng nhập lại."
        );
        Toast.show({
          type: "error",
          text1: "Không thể xác định người dùng",
          text2: "Vui lòng đăng nhập lại để tiếp tục.",
        });
        router.push("/auth/sign-in");
        return;
      }

      setIsProcessingReturn(true);
      setStatusMessage("Thanh toán thành công! Đang kích hoạt Premium...");

      try {
        await markUserAsPremium(token, userId);
        const updatedUser = await fetchUserProfile(token, userId);

        if (!updatedUser?.isPremium) {
          throw new Error(
            "Hệ thống chưa xác nhận quyền Premium. Hãy thử lại sau ít phút hoặc liên hệ hỗ trợ."
          );
        }

        await cacheUserProfile(updatedUser);

        Toast.show({
          type: "success",
          text1: "Kích hoạt Premium thành công",
          text2: "Đang chuyển bạn về trang chính.",
        });

        setTimeout(() => {
          clearStatusParams();
          router.replace("/(tabs)/dashboard");
        }, 1200);
      } catch (error) {
        console.error("[PremiumScreen] finalize payment error", error);
        const message =
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái tài khoản sau thanh toán.";
        setStatusMessage(message);
        setPaymentError(message);
        Toast.show({
          type: "error",
          text1: "Kích hoạt thất bại",
          text2: message,
        });
      } finally {
        setIsProcessingReturn(false);
        setAwaitingUpgradeAfterLogin(false);
      }
    },
    [
      cacheUserProfile,
      clearStatusParams,
      fetchUserProfile,
      isProcessingReturn,
      markUserAsPremium,
      router,
    ]
  );

  // Dùng useFocusEffect để bắt khi màn hình được focus lại từ browser
  useFocusEffect(
    useCallback(() => {
      console.log("------------");
      console.log("[PremiumScreen] Screen focused - params:", params);

      const status = extractSingleParam(params.status)?.toUpperCase();
      const cancelFlag = extractSingleParam(params.cancel);
      const orderCode =
        extractSingleParam(params.orderCode) ??
        extractSingleParam(params.order_code);
      const code = extractSingleParam(params.code);

      console.log("[PremiumScreen] Parsed status:", status);
      console.log("[PremiumScreen] Cancel flag:", cancelFlag);
      console.log("[PremiumScreen] Code:", code);
      console.log("[PremiumScreen] OrderCode:", orderCode);

      // PayOS trả về status=PAID khi thành công, status=CANCELLED khi hủy
      // Hoặc có thể dùng code: "00" là success
      if (status === "PAID" || (code === "00" && cancelFlag !== "true")) {
        console.log(
          "[PremiumScreen] Payment SUCCESS - calling finalizeSuccessfulPayment"
        );
        void finalizeSuccessfulPayment(orderCode ?? null, null);
      } else if (status === "CANCELLED" || cancelFlag === "true") {
        console.log("[PremiumScreen] Payment CANCELLED");
        setStatusMessage("Thanh toán đã bị hủy. Bạn có thể thử lại.");
      } else {
        console.log("[PremiumScreen] Unknown payment status");
      }
    }, [finalizeSuccessfulPayment, params])
  );

  // Giữ lại useEffect để log initial params
  useEffect(() => {
    console.log("[PremiumScreen] useEffect triggered - params:", params);
  }, [params]);

  const handleStartPremium = useCallback(
    async (option: PremiumOption) => {
      setPaymentError(null);
      if (isProcessingReturn) return;

      const token = await getSecureData("accessToken");
      if (!token) {
        Toast.show({
          type: "info",
          text1: "Cần đăng nhập",
          text2: "Đăng nhập để tiếp tục nâng cấp Premium.",
        });
        router.push("/auth/sign-in");
        return;
      }

      const userId = await getUserIdFromToken();
      if (!userId) {
        Toast.show({
          type: "error",
          text1: "Không xác định được tài khoản",
          text2: "Vui lòng đăng nhập lại để tiếp tục.",
        });
        router.push("/auth/sign-in");
        return;
      }

      if (awaitingUpgradeAfterLogin) {
        await finalizeSuccessfulPayment(null, token);
        return;
      }

      if (isCreatingPayment) return;

      setIsCreatingPayment(true);

      const payload = {
        userId,
        description: sanitizeDescription(PAYOS_DESCRIPTION) || PLAN_NAME,
        cancelUrl: payOSCancelUrl,
        returnUrl: payOSReturnUrl,
        items: [{ name: `${option.label} - ${PLAN_NAME}` }],
        durationMonths: option.duration,
        amount: option.priceVND,
      };

      // console.log("[PremiumScreen] PayOS Callback URLs:");
      // console.log("- Return URL:", payOSReturnUrl);
      // console.log("- Cancel URL:", payOSCancelUrl);
      // console.log("- App Ownership:", Constants.appOwnership);
      // console.log("- Host URI:", Constants.expoConfig?.hostUri);

      try {
        const apiEndpoint = option.endpoint
          ? `${backendBaseUrl}${option.endpoint}`
          : paymentEndpoint;

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const rawText = await response.text();
        let data: PayOSPayload | null = null;

        try {
          data = rawText ? (JSON.parse(rawText) as PayOSPayload) : null;
        } catch (parseError) {
          console.warn(
            "[PremiumScreen] PayOS response is not JSON",
            rawText,
            parseError
          );
        }

        if (!response.ok) {
          const message =
            (data as any)?.error ||
            (data as any)?.message ||
            `Không thể tạo thanh toán (HTTP ${response.status})`;
          throw new Error(message);
        }

        const checkoutUrl = resolveCheckoutUrl(
          data?.data ? (data?.data as PayOSPayload) : data
        );
        if (!checkoutUrl) {
          console.error("[PremiumScreen] Unexpected PayOS payload", data);
          throw new Error("Không nhận được đường dẫn thanh toán.");
        }

        Toast.show({
          type: "success",
          text1: "Đang chuyển đến PayOS",
          text2: "Hoàn tất thanh toán để kích hoạt Premium.",
        });

        const result = await WebBrowser.openBrowserAsync(checkoutUrl);
        console.log("[PremiumScreen] WebBrowser result:", result);
      } catch (error) {
        console.error("[PremiumScreen] create payment link error", error);
        const message =
          error instanceof Error ? error.message : "Không thể tạo thanh toán.";
        setPaymentError(message);
        Toast.show({
          type: "error",
          text1: "Tạo thanh toán thất bại",
          text2: message,
        });
      } finally {
        setIsCreatingPayment(false);
      }
    },
    [
      awaitingUpgradeAfterLogin,
      backendBaseUrl,
      finalizeSuccessfulPayment,
      isCreatingPayment,
      isProcessingReturn,
      paymentEndpoint,
      payOSCancelUrl,
      payOSReturnUrl,
      router,
    ]
  );

  const renderFeatures = useMemo(
    () =>
      FEATURE_LIST.map((feature) => (
        <View key={feature} style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Text style={styles.featureIconText}>✓</Text>
          </View>
          <Text style={styles.featureText}>{feature}</Text>
        </View>
      )),
    []
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {statusMessage ? (
        <View
          style={[
            styles.statusBanner,
            isProcessingReturn && styles.statusBannerProcessing,
          ]}
        >
          <Text style={styles.statusBannerText}>{statusMessage}</Text>
        </View>
      ) : null}

      <View style={styles.headerBlock}>
        <Text style={styles.sectionEyebrow}>GÓI GIÁ</Text>
        <Text style={styles.sectionTitle}>Chọn Trợ lý Du lịch AI của bạn</Text>
        <Text style={styles.sectionSubtitle}>
          Bắt đầu với gói miễn phí hoặc mở khóa sức mạnh đầy đủ của lập kế hoạch
          du lịch AI với Premium với giá rẻ hơn một ly cà phê.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.planTitle}>Gói Premium</Text>
          {/* <View style={styles.priceRow}>
            <Text style={styles.priceMain}>~1.99 USD</Text>
            <Text style={styles.priceSuffix}>/ tháng</Text>
          </View> */}
          {/* <Text style={styles.priceSub}>({PLAN_PRICE_VND.toLocaleString("vi-VN")} VND)</Text> */}
          <Text style={styles.planDescription}>{PLAN_DESCRIPTION}</Text>
        </View>

        <View style={styles.featureBlock}>
          <View style={styles.featureHeader}>
            {/* <Text style={styles.featureHeaderIcon}>✓</Text> */}
            <Text style={styles.featureHeaderText}>Bao gồm:</Text>
          </View>
          {renderFeatures}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isCreatingPayment}
          onPress={() => {
            void handleStartPremium(PREMIUM_OPTIONS[0]);
          }}
          style={[
            styles.primaryButton,
            isCreatingPayment && styles.primaryButtonDisabled,
            {
              backgroundColor: Colors.WHITE,
              borderWidth: 3,
              borderColor: Colors.GREEN,
            },
          ]}
        >
          {isCreatingPayment ? (
            <ActivityIndicator color={Colors.GREEN} size="small" />
          ) : (
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.primaryButtonText, { color: Colors.GREEN }]}>
                {PREMIUM_OPTIONS[0].priceUSD}
              </Text>
              <Text style={[styles.primaryButtonSub, { color: Colors.GREEN }]}>
                ({PREMIUM_OPTIONS[0].priceVND.toLocaleString("vi-VN")} VND)
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.badgeWrapper}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>★</Text>
            <Text style={styles.badgeText}>Phổ biến nhất</Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isCreatingPayment}
          onPress={() => {
            void handleStartPremium(PREMIUM_OPTIONS[1]);
          }}
          style={[
            styles.primaryButton,
            isCreatingPayment && styles.primaryButtonDisabled,
            {
              marginBottom: 18,
              shadowColor: Colors.GREEN,
              shadowOpacity: 0.3,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            },
          ]}
        >
          {isCreatingPayment ? (
            <ActivityIndicator color={Colors.WHITE} size="small" />
          ) : (
            <View style={{ alignItems: "center" }}>
              <Text style={styles.primaryButtonText}>
                {PREMIUM_OPTIONS[1].priceUSD}
              </Text>
              <Text style={styles.primaryButtonSub}>
                ({PREMIUM_OPTIONS[1].priceVND.toLocaleString("vi-VN")} VND)
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isCreatingPayment}
          onPress={() => {
            void handleStartPremium(PREMIUM_OPTIONS[2]);
          }}
          style={[
            styles.primaryButton,
            isCreatingPayment && styles.primaryButtonDisabled,
            {
              backgroundColor: Colors.WHITE,
              borderWidth: 3,
              borderColor: Colors.GREEN,
            },
          ]}
        >
          {isCreatingPayment ? (
            <ActivityIndicator color={Colors.GREEN} size="small" />
          ) : (
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.primaryButtonText, { color: Colors.GREEN }]}>
                {PREMIUM_OPTIONS[2].priceUSD}
              </Text>
              <Text style={[styles.primaryButtonSub, { color: Colors.GREEN }]}>
                ({PREMIUM_OPTIONS[2].priceVND.toLocaleString("vi-VN")} VND)
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {paymentError ? (
          <Text style={styles.errorText}>{paymentError}</Text>
        ) : null}
      </View>

      <View style={styles.guaranteeBlock}>
        <View style={styles.guaranteeBadge}>
          {/* <Text style={styles.guaranteeIcon}>🛡️</Text> */}
          <MaterialCommunityIcons
            name="shield-half-full"
            size={24}
            color={Colors.GREEN}
          />
          <Text style={styles.guaranteeText}> Bảo đảm hoàn tiền 30 ngày</Text>
        </View>
        <Text style={styles.guaranteeDescription}>
          Thử Premium không rủi ro. Nếu bạn không hoàn toàn hài lòng, nhận hoàn
          tiền đầy đủ trong vòng 30 ngày.
        </Text>
      </View>
    </ScrollView>
  );
};

export default PremiumScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.WHITE,
  },
  headerBlock: {
    alignItems: "center",
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  sectionEyebrow: {
    color: Colors.GREEN,
    fontFamily: "inter-medium",
    fontSize: 12,
    letterSpacing: 3,
    marginBottom: 10,
  },
  sectionTitle: {
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    fontSize: 28,
    textAlign: "center",
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: "#475569",
    fontFamily: "inter-regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.GREEN,
    padding: 22,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  badgeWrapper: {
    marginTop: 18,
    alignItems: "center",
    // marginBottom: 18,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.GREEN,
    paddingHorizontal: 16,
    paddingVertical: 3,
    shadowColor: Colors.GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    position: "absolute",
    zIndex: 2,
  },
  badgeIcon: {
    color: Colors.GREEN,
    fontFamily: "inter-medium",
    marginRight: 8,
    fontSize: 10,
  },
  badgeText: {
    color: Colors.GREEN,
    fontFamily: "inter-medium",
    fontSize: 10,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  planTitle: {
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    fontSize: 24,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  priceMain: {
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    fontSize: 26,
  },
  priceSuffix: {
    color: "#475569",
    fontFamily: "inter-regular",
    fontSize: 14,
  },
  priceSub: {
    color: "#6B7280",
    fontFamily: "inter-medium",
    fontSize: 13,
    marginTop: 6,
  },
  planDescription: {
    color: "#475569",
    fontFamily: "inter-regular",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
  featureBlock: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 16,
    marginTop: 8,
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureHeaderIcon: {
    color: Colors.GREEN,
    fontFamily: "inter-medium",
    marginRight: 8,
  },
  featureHeaderText: {
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    fontSize: 15,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    // backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureIconText: {
    color: Colors.GREEN,
    fontFamily: "inter-medium",
    fontSize: 14,
  },
  featureText: {
    color: "#475569",
    fontFamily: "inter-regular",
    fontSize: 14,
    flex: 1,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.GREEN,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 18,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: Colors.WHITE,
    fontFamily: "inter-medium",
    fontSize: 15,
  },
  primaryButtonSub: {
    color: Colors.WHITE,
    fontFamily: "inter-regular",
    fontSize: 13,
  },
  primaryButtonIcon: {
    color: Colors.WHITE,
    fontSize: 18,
    marginLeft: 10,
  },
  errorText: {
    color: Colors.RED,
    fontFamily: "inter-regular",
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },
  guaranteeBlock: {
    alignItems: "center",
    marginTop: 28,
    paddingHorizontal: 10,
  },
  guaranteeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.GREEN + "20",
    borderColor: Colors.GREEN + "60",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  guaranteeIcon: {
    marginRight: 10,
  },
  guaranteeText: {
    color: "#047857",
    fontFamily: "inter-medium",
    fontSize: 14,
  },
  guaranteeDescription: {
    color: "#475569",
    fontFamily: "inter-regular",
    fontSize: 13,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 20,
  },
  statusBanner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#34D399",
    backgroundColor: "#ECFDF5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statusBannerProcessing: {
    borderColor: "#FBBF24",
    backgroundColor: "#FEF9C3",
  },
  statusBannerText: {
    color: "#065F46",
    fontFamily: "inter-medium",
    fontSize: 13,
    textAlign: "center",
  },
});
