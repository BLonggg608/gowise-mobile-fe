import { Colors } from "@/constant/Colors";
import { getSecureData } from "@/utils/storage";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type UploadResult = {
  success: boolean;
  count?: number;
};

type ImageUploadModalProps = {
  visible: boolean;
  onClose: () => void;
  onUploadComplete: (result: UploadResult) => void;
};

type SelectedImage = {
  uri: string;
  name: string;
  size: number | null;
  type: string;
};

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";

  if (!domain) {
    console.error("[ImageUploadModal] Missing BE_DOMAIN configuration");
    return null;
  }

  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return port
    ? `${trimmedDomain}:${port}${normalizedPath}`
    : `${trimmedDomain}${normalizedPath}`;
};

const generateUUID = () => {
  const cryptoRef = globalThis?.crypto as
    | { randomUUID?: () => string }
    | undefined;
  if (cryptoRef?.randomUUID) {
    return cryptoRef.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const formatFileSize = (size: number | null) => {
  if (!size) return "";
  const mb = size / 1024 / 1024;
  return `${mb.toFixed(1)}MB`;
};

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  visible,
  onClose,
  onUploadComplete,
}) => {
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const requestPermission = async () => {
      setIsRequestingPermission(true);
      try {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          setErrorMessage(
            "Ứng dụng cần quyền truy cập thư viện ảnh để tải lên."
          );
        }
      } catch (err) {
        console.error("[ImageUploadModal] Permission error", err);
        setErrorMessage("Không thể truy cập thư viện ảnh.");
      } finally {
        setIsRequestingPermission(false);
      }
    };

    requestPermission();
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setCaption("");
      setLocation("");
      setSelectedImages([]);
      setErrorMessage(null);
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [visible]);

  const handleCloseModal = useCallback(() => {
    if (!isUploading) {
      onClose();
      return;
    }

    Alert.alert(
      "Đang tải lên",
      "Ảnh vẫn đang được tải lên. Bạn có chắc muốn hủy?",
      [
        { text: "Tiếp tục", style: "cancel" },
        {
          text: "Hủy",
          style: "destructive",
          onPress: onClose,
        },
      ]
    );
  }, [isUploading, onClose]);

  const appendImages = useCallback((assets: ImagePicker.ImagePickerAsset[]) => {
    if (!assets || assets.length === 0) return;

    const oversizeFiles = assets.filter(
      (asset) =>
        typeof asset.fileSize === "number" && asset.fileSize > MAX_FILE_SIZE
    );

    if (oversizeFiles.length > 0) {
      const names = oversizeFiles
        .map((asset) => {
          const name = asset.fileName ?? asset.uri.split("/").pop() ?? "Ảnh";
          const size = asset.fileSize
            ? (asset.fileSize / 1024 / 1024).toFixed(2)
            : "?";
          return `${name} (${size}MB)`;
        })
        .join(", ");
      setErrorMessage(`Các ảnh sau vượt quá giới hạn 100MB: ${names}`);
      return;
    }

    const mapped: SelectedImage[] = assets.map((asset, idx) => ({
      uri: asset.uri,
      name:
        asset.fileName ||
        asset.uri.split("/").pop() ||
        `photo-${Date.now()}-${idx}.jpg`,
      size: typeof asset.fileSize === "number" ? asset.fileSize : null,
      type: asset.mimeType || "image/jpeg",
    }));

    setSelectedImages((prev) => [...prev, ...mapped]);
    setErrorMessage(null);
  }, []);

  const handlePickImages = useCallback(async () => {
    if (isUploading || isRequestingPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 0,
        quality: 1,
      });

      if (result.canceled) return;

      appendImages(result.assets ?? []);
    } catch (err) {
      console.error("[ImageUploadModal] Image pick error", err);
      setErrorMessage("Không thể chọn ảnh. Vui lòng thử lại.");
    }
  }, [appendImages, isRequestingPermission, isUploading]);

  const removeImageAt = useCallback((index: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const uploadEndpoint = useMemo(() => buildApiUrl("/api/gallery/upload"), []);

  const resetForm = useCallback(() => {
    setCaption("");
    setLocation("");
    setSelectedImages([]);
    setUploadProgress(0);
    setErrorMessage(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isUploading) return;

    if (selectedImages.length === 0 || caption.trim().length === 0) {
      setErrorMessage("Vui lòng nhập chú thích và chọn ít nhất 1 ảnh.");
      return;
    }

    if (!uploadEndpoint) {
      setErrorMessage("Thiếu cấu hình máy chủ. Vui lòng kiểm tra lại.");
      return;
    }

    try {
      const token = await getSecureData("accessToken");
      const userId = await getUserIdFromToken();

      if (!token || !userId) {
        setErrorMessage("Vui lòng đăng nhập để tải ảnh lên.");
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setErrorMessage(null);

      const galleryId = generateUUID();
      let successCount = 0;
      let failCount = 0;

      for (let index = 0; index < selectedImages.length; index += 1) {
        const image = selectedImages[index];
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("galleryId", galleryId);
        formData.append("caption", caption.trim());
        if (location.trim()) {
          formData.append("location", location.trim());
        }

        formData.append("file", {
          uri: image.uri,
          name: image.name,
          type: image.type,
        } as any);

        try {
          const response = await fetch(uploadEndpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (response.ok) {
            successCount += 1;
          } else {
            failCount += 1;
            if (response.status === 413) {
              const sizeText = formatFileSize(image.size);
              setErrorMessage(
                `Ảnh "${image.name}" quá lớn${
                  sizeText ? ` (${sizeText})` : ""
                }. Giới hạn là 100MB.`
              );
            } else {
              const message = await response.text();
              console.error(
                `[ImageUploadModal] Failed upload (${response.status}):`,
                message
              );
            }
          }
        } catch (err) {
          failCount += 1;
          console.error("[ImageUploadModal] Upload error", err);
        }

        const progress = Math.round(
          ((index + 1) / selectedImages.length) * 100
        );
        setUploadProgress(progress);
      }

      await new Promise((resolve) => setTimeout(resolve, 400));

      if (failCount === 0) {
        Alert.alert("Thành công", `Đã tải lên ${successCount} ảnh.`);
        onUploadComplete({ success: true, count: successCount });
        resetForm();
        onClose();
      } else {
        Alert.alert(
          "Hoàn tất với lỗi",
          `Thành công: ${successCount} ảnh\nThất bại: ${failCount} ảnh`
        );
        onUploadComplete({ success: failCount === 0, count: successCount });
      }
    } catch (err) {
      console.error("[ImageUploadModal] Unexpected error", err);
      setErrorMessage("Đã xảy ra lỗi khi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [
    caption,
    location,
    isUploading,
    onClose,
    onUploadComplete,
    resetForm,
    selectedImages,
    uploadEndpoint,
  ]);

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable onPress={handleCloseModal} style={styles.backdrop} />

        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons color={Colors.WHITE} name="images" size={20} />
              </View>
              <Text style={styles.headerTitle}>Tạo kho ảnh mới</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Đóng"
              onPress={handleCloseModal}
              style={styles.headerClose}
            >
              <Ionicons color={Colors.WHITE} name="close" size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Chú thích <Text style={styles.labelRequired}>*</Text>
              </Text>
              <TextInput
                editable={!isUploading}
                onChangeText={setCaption}
                placeholder="Ví dụ: Chuyến đi Tokyo 2025"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={caption}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Vị trí (Tùy chọn)</Text>
              <TextInput
                editable={!isUploading}
                onChangeText={setLocation}
                placeholder="Ví dụ: Tokyo, Nhật Bản"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={location}
              />
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons color="#DC2626" name="alert-circle" size={18} />
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity onPress={() => setErrorMessage(null)}>
                  <Ionicons color="#F87171" name="close" size={18} />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.dropzone}>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isUploading}
                onPress={handlePickImages}
                style={[styles.dropzoneAction, isUploading && styles.disabled]}
              >
                <Ionicons
                  color={Colors.GREEN}
                  name="cloud-upload-outline"
                  size={46}
                />
                <Text style={styles.dropzoneTitle}>Chọn ảnh từ máy</Text>
                <Text style={styles.dropzoneSubtitle}>
                  Hỗ trợ JPG, PNG, GIF (tối đa 100MB mỗi ảnh)
                </Text>
                <View style={styles.pickButton}>
                  <Text style={styles.pickButtonText}>Mở thư viện</Text>
                </View>
              </TouchableOpacity>
            </View>

            {selectedImages.length > 0 ? (
              <View style={styles.previewSection}>
                <Text style={styles.previewTitle}>
                  Ảnh đã chọn ({selectedImages.length})
                </Text>
                <View style={styles.previewGrid}>
                  {selectedImages.map((image, index) => (
                    <View key={image.uri} style={styles.previewItem}>
                      <Image
                        source={{ uri: image.uri }}
                        style={styles.previewImage}
                      />
                      <TouchableOpacity
                        accessibilityLabel="Xóa ảnh"
                        onPress={() => removeImageAt(index)}
                        style={styles.removeButton}
                      >
                        <Ionicons color={Colors.WHITE} name="trash" size={16} />
                      </TouchableOpacity>
                      <View style={styles.previewCaption}>
                        <Text
                          numberOfLines={1}
                          style={styles.previewCaptionText}
                        >
                          {image.name}
                        </Text>
                        <Text style={styles.previewCaptionSize}>
                          {formatFileSize(image.size)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            {isUploading ? (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Đang tải lên...</Text>
                  <Text style={styles.progressLabel}>{uploadProgress}%</Text>
                </View>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${uploadProgress}%` },
                    ]}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.footerActions}>
              <TouchableOpacity
                disabled={isUploading}
                onPress={handleCloseModal}
                style={[
                  styles.footerButton,
                  styles.cancelButton,
                  isUploading && styles.disabled,
                ]}
              >
                <Text style={styles.cancelText}>
                  {isUploading ? "Đang tải..." : "Hủy"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isUploading || selectedImages.length === 0}
                onPress={handleSubmit}
                style={[
                  styles.footerButton,
                  styles.primaryButton,
                  (isUploading || selectedImages.length === 0) &&
                    styles.disabled,
                ]}
              >
                {isUploading ? (
                  <ActivityIndicator color={Colors.WHITE} size="small" />
                ) : (
                  <Text style={styles.primaryText}>
                    Tải lên ({selectedImages.length} ảnh)
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ImageUploadModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    borderRadius: 24,
    backgroundColor: Colors.WHITE,
    overflow: "hidden",
    maxHeight: "92%",
  },
  header: {
    backgroundColor: Colors.GREEN,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "inter-bold",
    color: Colors.WHITE,
  },
  headerClose: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  labelRequired: {
    color: "#DC2626",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "inter-medium",
    fontSize: 14,
    color: Colors.BLACK,
    backgroundColor: Colors.WHITE,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "inter-medium",
    color: "#B91C1C",
  },
  dropzone: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 18,
    borderColor: "#0F766E",
    padding: 22,
    backgroundColor: "#F0FDFA",
  },
  dropzoneAction: {
    alignItems: "center",
    gap: 10,
  },
  dropzoneTitle: {
    fontSize: 16,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
  },
  dropzoneSubtitle: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
    textAlign: "center",
  },
  pickButton: {
    marginTop: 8,
    backgroundColor: Colors.GREEN,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  pickButtonText: {
    color: Colors.WHITE,
    fontFamily: "inter-medium",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  previewSection: {
    gap: 12,
  },
  previewTitle: {
    fontSize: 15,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
  },
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  previewItem: {
    width: "47%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    aspectRatio: 1,
  },
  removeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(220, 38, 38, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCaption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
  },
  previewCaptionText: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
  previewCaptionSize: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: "inter-regular",
    color: "#E2E8F0",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    padding: 18,
    gap: 14,
    backgroundColor: "#F8FAFC",
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 5,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    borderRadius: 5,
    backgroundColor: Colors.GREEN,
  },
  footerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  footerButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  primaryButton: {
    backgroundColor: Colors.GREEN,
  },
  primaryText: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
});
