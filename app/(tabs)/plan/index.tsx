import CreateNewPlanModel from "@/components/Plan/CreateNewPlan/CreateNewPlanModal";
import PlanCard, { PlanListItem, PlanStatus } from "@/components/Plan/PlanCard";
import { Colors } from "@/constant/Colors";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import { saveData } from "@/utils/localStorage";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { RelativePathString, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "toastify-react-native";

const statusBarHeight = Constants.statusBarHeight;

type IconName = keyof typeof Ionicons.glyphMap;

type SortOption = "created" | "budget" | "duration";
type StatusFilter = "all" | PlanStatus;

type ApiPlan = {
  _id?: { $oid?: string };
  id?: string;
  plan_id?: string;
  planId?: string;
  planID?: string;
  created_at?: string;
  createdAt?: string;
  status?: string;
  plan_content?: Record<string, unknown>;
  planContent?: Record<string, unknown>;
  [key: string]: unknown;
};

type StatCardProps = {
  label: string;
  value: number;
  icon: IconName;
  background: string;
  iconBackground: string;
  iconColor: string;
};

const planStatusColors: Record<PlanStatus, string> = {
  active: Colors.LIGHT_GREEN,
  draft: Colors.YELLOW,
  completed: Colors.GREEN,
};

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Đang hoạt động" },
  { value: "draft", label: "Bản nháp" },
  { value: "completed", label: "Hoàn thành" },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "created", label: "Ngày tạo" },
  { value: "budget", label: "Ngân sách" },
  { value: "duration", label: "Thời lượng" },
];

const SummaryStatCard = ({
  label,
  value,
  icon,
  background,
  iconBackground,
  iconColor,
}: StatCardProps) => (
  <View style={[styles.statCard, { backgroundColor: background }]}>
    <View style={[styles.statIconWrapper, { backgroundColor: iconBackground }]}>
      <Ionicons color={iconColor} name={icon} size={18} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";

  if (!domain) {
    throw new Error("Thiếu cấu hình máy chủ");
  }

  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const formattedPath = path.startsWith("/") ? path : `/${path}`;

  return port
    ? `${trimmedDomain}:${port}${formattedPath}`
    : `${trimmedDomain}${formattedPath}`;
};

const parseDateValue = (value?: unknown) => {
  if (!value || typeof value !== "string") return null;

  if (value.includes("/")) {
    const parts = value.split("/").map((part) => Number(part));
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const parsed = new Date(year, month - 1, day);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const formatCurrency = (value: number) => {
  if (!value || Number.isNaN(value)) {
    return "$0";
  }
  return `$${value.toLocaleString("en-US")}`;
};

const normalizeStatus = (status?: unknown): PlanStatus => {
  const normalized = String(status ?? "active").toLowerCase();

  if (normalized.includes("draft")) return "draft";
  if (normalized.includes("complete")) return "completed";
  return "active";
};

const getPlanIdentifier = (plan: ApiPlan) => {
  const content =
    (plan.plan_content as Record<string, unknown> | undefined) ??
    (plan.planContent as Record<string, unknown> | undefined) ??
    {};

  return (
    plan._id?.$oid ||
    (typeof plan.plan_id === "string" ? plan.plan_id : undefined) ||
    (typeof plan.planId === "string" ? plan.planId : undefined) ||
    (typeof plan.planID === "string" ? plan.planID : undefined) ||
    (typeof plan.id === "string" ? plan.id : undefined) ||
    (typeof content?.plan_id === "string" ? content.plan_id : undefined) ||
    (typeof content?.planId === "string" ? content.planId : undefined)
  );
};

const transformPlan = (plan: ApiPlan): PlanListItem | null => {
  const content =
    (plan.plan_content as Record<string, unknown> | undefined) ??
    (plan.planContent as Record<string, unknown> | undefined) ??
    {};

  const id = getPlanIdentifier(plan);
  if (!id) return null;

  const destination =
    (content.destination as string | undefined) ||
    (content.location as string | undefined) ||
    (plan.destination as string | undefined) ||
    "Không xác định";

  const startDateRaw =
    (content.startDate as string | undefined) ||
    (content.start_date as string | undefined);
  const endDateRaw =
    (content.endDate as string | undefined) ||
    (content.end_date as string | undefined);

  const startDate = parseDateValue(startDateRaw);
  const endDate = parseDateValue(endDateRaw);

  const durationInDays =
    startDate && endDate
      ? Math.max(
          1,
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const durationLabel =
    durationInDays > 0 ? `${durationInDays} ngày` : "Không xác định";

  const rawBudget =
    (content.budget as string | number | undefined) ||
    (plan.budget as string | number | undefined);

  let budgetValue = 0;
  if (typeof rawBudget === "number") {
    budgetValue = rawBudget;
  } else if (typeof rawBudget === "string") {
    const parsed = Number(rawBudget.replace(/[^0-9.-]/g, ""));
    if (!Number.isNaN(parsed)) budgetValue = parsed;
  }

  const createdDate =
    parseDateValue(plan.created_at) ||
    parseDateValue(plan.createdAt) ||
    parseDateValue(content.createdAt);

  const createdLabel = createdDate
    ? createdDate.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Không rõ";

  const participantsRaw =
    content.participants ||
    content.travelers ||
    content.groupSize ||
    content.group_size;
  const participantsNumber = Number(participantsRaw);
  const participantsLabel = !Number.isNaN(participantsNumber)
    ? participantsNumber.toString()
    : "1";

  const description = `Kế hoạch du lịch cho ${participantsLabel} ${
    participantsLabel === "1" ? "người" : "người"
  } đến ${destination}`;

  const status = normalizeStatus(plan.status || content.status);

  const title =
    (content.title as string | undefined) ||
    (plan.title as string | undefined) ||
    (destination !== "Không xác định"
      ? `Chuyến đi đến ${destination}`
      : "Kế hoạch không xác định");

  return {
    id,
    title,
    location: destination,
    durationLabel,
    budgetLabel: formatCurrency(budgetValue),
    createdLabel,
    status,
    description,
    durationInDays,
    budgetValue,
    createdValue: createdDate ? createdDate.getTime() : 0,
    raw: plan,
  };
};

const Plan = () => {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [searchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("created");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatePlanModalVisible, setIsCreatePlanModalVisible] =
    useState(false);

  const stats = useMemo(
    () => ({
      total: plans.length,
      active: plans.filter((plan) => plan.status === "active").length,
      draft: plans.filter((plan) => plan.status === "draft").length,
      completed: plans.filter((plan) => plan.status === "completed").length,
    }),
    [plans]
  );

  const filteredPlans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = plans.filter((plan) => {
      const matchesSearch =
        !query ||
        plan.title.toLowerCase().includes(query) ||
        plan.location.toLowerCase().includes(query);
      const matchesStatus =
        selectedStatus === "all" || plan.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "budget":
          return (b.budgetValue ?? 0) - (a.budgetValue ?? 0);
        case "duration":
          return (b.durationInDays ?? 0) - (a.durationInDays ?? 0);
        case "created":
        default:
          return (b.createdValue ?? 0) - (a.createdValue ?? 0);
      }
    });

    return sorted;
  }, [plans, searchQuery, selectedStatus, sortBy]);

  const fetchPlans = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true);
    }

    try {
      setError(null);

      const currentUserId = await getUserIdFromToken();
      if (!currentUserId) {
        setPlans([]);
        setError("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
        return;
      }

      setUserId(currentUserId);

      const response = await fetch(buildApiUrl(`/plans/${currentUserId}`), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Không thể tải kế hoạch. Vui lòng thử lại.");
      }

      const data = await response.json();
      const rawPlans: ApiPlan[] = Array.isArray(data?.plans)
        ? data.plans
        : Array.isArray(data)
        ? data
        : [];

      const transformed = rawPlans
        .map(transformPlan)
        .filter((plan): plan is PlanListItem => Boolean(plan));

      setPlans(transformed);
    } catch (err) {
      console.error("[plan] fetchPlans error", err);
      setPlans([]);
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải kế hoạch."
      );
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [fetchPlans])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchPlans({ silent: true });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPlans]);

  const handleRetry = useCallback(() => {
    fetchPlans();
  }, [fetchPlans]);

  const confirmDeletePlan = useCallback(
    async (plan: PlanListItem) => {
      try {
        const ensuredUserId = userId ?? (await getUserIdFromToken());
        if (!ensuredUserId) {
          Toast.show({
            type: "error",
            text1: "Không thể xác định người dùng",
            text2: "Vui lòng đăng nhập lại.",
          });
          return;
        }

        const response = await fetch(
          buildApiUrl(`/plans/${ensuredUserId}/${plan.id}`),
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Không thể xóa kế hoạch. Vui lòng thử lại.");
        }

        setPlans((prev) => prev.filter((item) => item.id !== plan.id));

        Toast.show({
          type: "success",
          text1: "Đã xóa kế hoạch",
          text2: "Kế hoạch đã được xóa thành công.",
        });
      } catch (err) {
        console.error("[plan] deletePlan error", err);
        Toast.show({
          type: "error",
          text1: "Xóa kế hoạch thất bại",
          text2:
            err instanceof Error
              ? err.message
              : "Đã xảy ra lỗi, vui lòng thử lại sau.",
        });
      }
    },
    [userId]
  );

  const handleDeletePlan = useCallback(
    (plan: PlanListItem) => {
      Alert.alert(
        "Xóa kế hoạch",
        `Bạn có chắc chắn muốn xóa "${plan.title}"?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa",
            style: "destructive",
            onPress: () => confirmDeletePlan(plan),
          },
        ]
      );
    },
    [confirmDeletePlan]
  );

  const handleOpenPlan = useCallback(
    async (plan: PlanListItem) => {
      try {
        const planRaw = (plan.raw ?? {}) as Record<string, unknown>;
        const planContentCandidate =
          (planRaw["plan_content"] as Record<string, unknown> | undefined) ??
          (planRaw["planContent"] as Record<string, unknown> | undefined);

        const planData: Record<string, unknown> = planContentCandidate
          ? { ...planContentCandidate }
          : { ...planRaw };

        if (Object.keys(planData).length === 0) {
          Toast.show({
            type: "error",
            text1: "Không có dữ liệu kế hoạch",
            text2: "Không thể mở kế hoạch này.",
          });
          return;
        }

        if (plan.id) {
          if (!planData["plan_id"]) {
            planData["plan_id"] = plan.id;
          }

          if (!planData["planId"]) {
            planData["planId"] = plan.id;
          }
        }

        if (!planData["title"]) {
          planData["title"] = plan.title;
        }

        if (!planData["destination"]) {
          planData["destination"] = plan.location;
        }

        if (!planData["status"]) {
          planData["status"] = plan.status;
        }

        if (!planData["hasExistingPlan"]) {
          planData["hasExistingPlan"] = true;
        }

        await saveData({ key: "travelPlanData", value: planData });

        router.push({ pathname: "/plan/plan-result", params: { from: "open-plan" } });
      } catch (err) {
        console.error("[plan] openPlan error", err);
        Toast.show({
          type: "error",
          text1: "Không thể mở kế hoạch",
          text2:
            err instanceof Error
              ? err.message
              : "Đã xảy ra lỗi, vui lòng thử lại sau.",
        });
      }
    },
    [router]
  );

  const handleCreatePlan = useCallback(() => {
    setIsCreatePlanModalVisible(true);
  }, []);

  const handleImportPlan = useCallback(() => {
    Toast.show({
      type: "error",
      text1: "Tính năng đang phát triển",
      text2: "Chúng tôi sẽ sớm hỗ trợ nhập kế hoạch.",
    });
  }, []);

  const handleSubmitCreateNewPlan = useCallback(
    (_data: {
      type: string;
      startDate: string;
      endDate: string;
      NumberOfDays: string;
      NumberOfParticipants: string;
      Budget: string;
      Destination: string;
    }) => {
      setIsCreatePlanModalVisible(false);
      handleRefresh();
    },
    [handleRefresh]
  );

  const renderListHeader = useCallback(() => {
    const statCardScheme: Record<
      string,
      Omit<StatCardProps, "label" | "value" | "icon"> & { icon: IconName }
    > = {
      total: {
        icon: "folder-open-outline",
        background: "#F8FAFC",
        iconBackground: "#E2E8F0",
        iconColor: Colors.GRAY,
      },
      active: {
        icon: "flash-outline",
        background: "#ECFDF5",
        iconBackground: "#D1FAE5",
        iconColor: Colors.GREEN,
      },
      draft: {
        icon: "document-text-outline",
        background: "#FEF3C7",
        iconBackground: "#FDE68A",
        iconColor: Colors.YELLOW,
      },
      completed: {
        icon: "checkmark-circle-outline",
        background: "#EEF2FF",
        iconBackground: "#E0E7FF",
        iconColor: Colors.GREEN,
      },
    };

    return (
      <View style={styles.listHeader}>
        <Text style={styles.pageSubtitle}>
          Tổ chức và quản lý tất cả kế hoạch du lịch của bạn ở một nơi ✈️
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCreatePlan}
            style={styles.primaryButton}
          >
            <Ionicons color={Colors.WHITE} name="add" size={18} />
            <Text style={styles.primaryButtonText}>Tạo kế hoạch mới</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleImportPlan}
            style={styles.secondaryButton}
          >
            <Ionicons
              color={Colors.BLACK}
              name="cloud-upload-outline"
              size={18}
            />
            <Text style={styles.secondaryButtonText}>Nhập kế hoạch</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {(
            [
              { key: "total", label: "Tổng kế hoạch", value: stats.total },
              { key: "active", label: "Đang hoạt động", value: stats.active },
              { key: "draft", label: "Bản nháp", value: stats.draft },
              { key: "completed", label: "Hoàn thành", value: stats.completed },
            ] as const
          ).map(({ key, label, value }) => (
            <SummaryStatCard
              key={key}
              background={statCardScheme[key].background}
              icon={statCardScheme[key].icon}
              iconBackground={statCardScheme[key].iconBackground}
              iconColor={statCardScheme[key].iconColor}
              label={label}
              value={value}
            />
          ))}
        </View>

        {/* <View style={styles.searchContainer}>
          <Ionicons color={Colors.GRAY} name="search-outline" size={18} />
          <TextInput
            placeholder="Tìm kế hoạch theo tiêu đề hoặc địa điểm..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearSearchButton}
            >
              <Ionicons color={Colors.GRAY} name="close-circle" size={18} />
            </TouchableOpacity>
          ) : null}
        </View> */}

        <Text style={styles.sectionTitle}>Trạng thái:</Text>
        <View style={styles.filtersRow}>
          {statusFilterOptions.map((option) => {
            const isActive = selectedStatus === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.85}
                onPress={() => setSelectedStatus(option.value)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Sắp xếp theo:</Text>
        <View style={styles.sortRow}>
          {sortOptions.map((option) => {
            const isActive = sortBy === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.85}
                onPress={() => setSortBy(option.value)}
                style={[styles.sortOption, isActive && styles.sortOptionActive]}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    isActive && styles.sortOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }, [
    handleCreatePlan,
    handleImportPlan,
    selectedStatus,
    sortBy,
    stats.active,
    stats.completed,
    stats.draft,
    stats.total,
  ]);

  const renderEmptyComponent = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={Colors.GREEN} size="large" />
          <Text style={styles.emptyTitle}>Đang tải kế hoạch...</Text>
          <Text style={styles.emptyMessage}>
            Vui lòng đợi trong khi chúng tôi tải danh sách kế hoạch của bạn.
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Ionicons color={Colors.RED} name="alert-circle-outline" size={36} />
          <Text style={styles.emptyTitle}>Không thể tải kế hoạch</Text>
          <Text style={styles.emptyMessage}>{error}</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRetry}
            style={[styles.emptyButton, { backgroundColor: Colors.GREEN }]}
          >
            <Text style={styles.emptyButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons color={Colors.GRAY} name="search-outline" size={36} />
        <Text style={styles.emptyTitle}>Không có kế hoạch phù hợp</Text>
        <Text style={styles.emptyMessage}>
          Hãy điều chỉnh tìm kiếm hoặc bộ lọc để tìm kế hoạch khác, hoặc tạo kế
          hoạch mới ngay bây giờ.
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleCreatePlan}
          style={styles.emptyButton}
        >
          <Text style={styles.emptyButtonText}>Tạo kế hoạch đầu tiên</Text>
        </TouchableOpacity>
      </View>
    );
  }, [error, handleCreatePlan, handleRetry, isLoading]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý kế hoạch</Text>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={filteredPlans}
        key="list"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyComponent}
        ListHeaderComponent={renderListHeader}
        numColumns={1}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            statusColors={planStatusColors}
            onDelete={handleDeletePlan}
            onPress={handleOpenPlan}
            viewMode="list"
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.fabContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/setting" as RelativePathString)}
          style={styles.fab}
        >
          <Ionicons color={Colors.WHITE} name="settings-outline" size={24} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleCreatePlan}
          style={styles.fab}
        >
          <Ionicons color={Colors.WHITE} name="add" size={24} />
        </TouchableOpacity>
      </View>

      <CreateNewPlanModel
        onClose={() => setIsCreatePlanModalVisible(false)}
        onSubmit={handleSubmitCreateNewPlan}
        visible={isCreatePlanModalVisible}
      />
    </View>
  );
};

export default Plan;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: statusBarHeight + 12,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 140,
    paddingTop: 18,
  },
  listHeader: {
    marginBottom: 18,
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: Colors.GREEN,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 8,
  },
  primaryButtonText: {
    color: Colors.WHITE,
    fontSize: 14,
    fontFamily: "inter-medium",
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    width: "48%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
  },
  clearSearchButton: {
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
    marginBottom: 4,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.GREEN,
    borderColor: Colors.GREEN,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  filterChipTextActive: {
    color: Colors.WHITE,
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
    padding: 4,
    // paddingVertical: 3,
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: Colors.WHITE,
  },
  sortOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    // borderWidth: 1,
    // borderColor: "#E2E8F0",
    // marginRight: 8,
    // backgroundColor: Colors.WHITE,
    flex: 1,
  },
  sortOptionActive: {
    borderColor: Colors.GREEN,
    backgroundColor: "rgba(13, 148, 136, 0.12)",
    // add shadow for active sort option to make it floating
    boxShadow: `1px 1px 2px rgba(34, 39, 39, 0.3)`,
  },
  sortOptionText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY + "70",
    textAlign: "center",
  },
  sortOptionTextActive: {
    color: Colors.GREEN,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginTop: 12,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginTop: 6,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: Colors.GREEN,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: Colors.WHITE,
    fontSize: 14,
    fontFamily: "inter-medium",
  },
  fabContainer: {
    position: "absolute",
    right: 10,
    bottom: 10,
  },
  fab: {
    backgroundColor: Colors.GREEN,
    borderRadius: 28,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: Colors.GREEN,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 8,
  },
});
