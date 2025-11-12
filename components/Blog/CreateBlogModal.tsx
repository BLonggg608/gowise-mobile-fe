import { Colors } from "@/constant/Colors";
import { getSecureData } from "@/utils/storage";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "toastify-react-native";

type CreateBlogModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

type CreateFormState = {
  title: string;
  content: string;
  category: string;
};

type CreateFormErrors = {
  title: string;
  content: string;
  category: string;
};

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";

  if (!domain) {
    console.error("[CreateBlogModal] Missing BE_DOMAIN configuration");
    return null;
  }

  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return port
    ? `${trimmedDomain}:${port}${normalizedPath}`
    : `${trimmedDomain}${normalizedPath}`;
};

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "du lịch", label: "Du lịch" },
  { value: "địa điểm ăn chơi", label: "Địa điểm ăn chơi" },
  { value: "đồ ăn & nước uống", label: "Đồ ăn & nước uống" },
  { value: "du lịch tiết kiệm", label: "Du lịch tiết kiệm" },
];

const INITIAL_ERRORS: CreateFormErrors = {
  title: "",
  content: "",
  category: "",
};

const CreateBlogModal = ({
  visible,
  onClose,
  onCreated,
}: CreateBlogModalProps) => {
  const defaultCategory = useMemo(() => CATEGORY_OPTIONS[0].value, []);

  const [form, setForm] = useState<CreateFormState>({
    title: "",
    content: "",
    category: defaultCategory,
  });

  const [errors, setErrors] = useState<CreateFormErrors>(INITIAL_ERRORS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setForm({ title: "", content: "", category: defaultCategory });
      setErrors(INITIAL_ERRORS);
      setIsSubmitting(false);
    }
  }, [defaultCategory, visible]);

  const updateField = useCallback(
    <K extends keyof CreateFormState>(field: K, value: CreateFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const validateForm = useCallback(() => {
    const nextErrors: CreateFormErrors = { ...INITIAL_ERRORS };

    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      nextErrors.title = "Tiêu đề không được để trống.";
    } else if (trimmedTitle.length < 6) {
      nextErrors.title = "Tiêu đề nên có ít nhất 6 ký tự.";
    }

    const trimmedContent = form.content.trim();
    if (!trimmedContent) {
      nextErrors.content = "Nội dung không được để trống.";
    } else if (trimmedContent.length < 50) {
      nextErrors.content = "Chia sẻ nhiều hơn (tối thiểu 50 ký tự).";
    }

    if (!form.category) {
      nextErrors.category = "Hãy chọn chuyên mục.";
    }

    setErrors(nextErrors);
    return !nextErrors.title && !nextErrors.content && !nextErrors.category;
  }, [form.category, form.content, form.title]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    const endpoint = buildApiUrl("/api/posts");
    if (!endpoint) {
      Toast.show({
        type: "error",
        text1: "Thiếu cấu hình",
        text2: "Không xác định được máy chủ Blog.",
      });
      return;
    }

    const userId = await getUserIdFromToken();
    if (!userId) {
      Toast.show({
        type: "error",
        text1: "Cần đăng nhập",
        text2: "Vui lòng đăng nhập để tạo bài viết.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getSecureData("accessToken");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-User-Id": userId,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category,
        }),
      });

      if (!response.ok) {
        let message = "Không thể tạo bài viết mới.";
        try {
          const payload = await response.json();
          if (payload?.message && typeof payload.message === "string") {
            message = payload.message;
          }
        } catch {
          // ignore JSON parse errors and fallback to default message
        }
        throw new Error(message);
      }

      Toast.show({
        type: "success",
        text1: "Đã gửi bài",
        text2: "Bài viết sẽ hiển thị sau khi được duyệt.",
      });

      onCreated?.();
    } catch (error) {
      console.error("[CreateBlogModal] submit error", error);
      Toast.show({
        type: "error",
        text1: "Gửi bài thất bại",
        text2:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi, vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    form.category,
    form.content,
    form.title,
    isSubmitting,
    onCreated,
    validateForm,
  ]);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={onClose}
            style={styles.touchableOverlay}
          />
        </View>

        <View style={styles.modalContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Tạo bài viết mới</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons color={Colors.GRAY} name="close" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tiêu đề</Text>
              <TextInput
                editable={!isSubmitting}
                onChangeText={(value) => updateField("title", value)}
                placeholder="Nhập tiêu đề"
                placeholderTextColor="#94A3B8"
                style={[styles.input, errors.title ? styles.inputError : null]}
                value={form.title}
              />
              {errors.title ? (
                <Text style={styles.errorText}>{errors.title}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nội dung</Text>
              <TextInput
                editable={!isSubmitting}
                multiline
                numberOfLines={8}
                onChangeText={(value) => updateField("content", value)}
                placeholder="Chia sẻ trải nghiệm của bạn"
                placeholderTextColor="#94A3B8"
                style={[
                  styles.textArea,
                  errors.content ? styles.inputError : null,
                ]}
                textAlignVertical="top"
                value={form.content}
              />
              {errors.content ? (
                <Text style={styles.errorText}>{errors.content}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Thể loại</Text>
              <View style={styles.categoryRow}>
                {CATEGORY_OPTIONS.map((option) => {
                  const isActive = form.category === option.value;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isSubmitting}
                      key={option.value}
                      onPress={() => updateField("category", option.value)}
                      style={[
                        styles.categoryChip,
                        isActive && styles.categoryChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          isActive && styles.categoryTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.category ? (
                <Text style={styles.errorText}>{errors.category}</Text>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footerRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isSubmitting}
              onPress={onClose}
              style={[
                styles.secondaryButton,
                isSubmitting && styles.disabledButton,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={[
                styles.primaryButton,
                isSubmitting && styles.disabledButton,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.WHITE} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Gửi bài viết</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateBlogModal;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    justifyContent: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  touchableOverlay: {
    flex: 1,
  },
  modalContainer: {
    marginHorizontal: 18,
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    elevation: 6,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  modalContent: {
    paddingBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "inter-regular",
    fontSize: 14,
    color: Colors.BLACK,
    backgroundColor: Colors.WHITE,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 160,
    fontFamily: "inter-regular",
    fontSize: 14,
    color: Colors.BLACK,
    backgroundColor: Colors.WHITE,
  },
  inputError: {
    borderColor: Colors.RED,
  },
  errorText: {
    marginTop: 6,
    color: Colors.RED,
    fontSize: 12,
    fontFamily: "inter-regular",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: Colors.WHITE,
  },
  categoryChipActive: {
    backgroundColor: Colors.GREEN,
    borderColor: Colors.GREEN,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  categoryTextActive: {
    color: Colors.WHITE,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  secondaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.GREEN,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 130,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
});
