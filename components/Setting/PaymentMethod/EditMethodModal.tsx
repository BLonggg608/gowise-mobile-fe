import { Colors } from "@/constant/Colors";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface EditMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    id: string;
    type: string;
    cardNumber: string;
    expires: string;
    isDefault: boolean;
  }) => void;
  method?: {
    id: string;
    type: string;
    cardNumber: string;
    expires: string;
    isDefault?: boolean;
  };
}

const cardTypeOptions = ["Visa", "Mastercard", "JCB"];

const EditMethodModal: React.FC<EditMethodModalProps> = ({
  visible,
  onClose,
  onSubmit,
  method,
}) => {
  // State cho các trường nhập
  const [type, setType] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const expires = month && year ? `${month}/${year}` : "";
  // State cho set default
  const [isDefault, setIsDefault] = useState(false);

  // Reset và set dữ liệu khi mở modal
  useEffect(() => {
    if (visible && method) {
      setType(method.type || "");
      setCardNumber(method.cardNumber || "");
      const [mm, yy] = method.expires ? method.expires.split("/") : ["", ""];
      setMonth(mm);
      setYear(yy);
      setIsDefault(!!method.isDefault);
    }
    if (!visible) {
      setType("");
      setCardNumber("");
      setMonth("");
      setYear("");
      setIsDefault(false);
    }
  }, [visible, method]);

  // Xử lý xác nhận
  const handleSubmit = () => {
    if (!type || !cardNumber || !month || !year || !method) return;
    onSubmit({
      id: method.id,
      type,
      cardNumber,
      expires,
      isDefault,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Edit Payment Method</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ color: Colors.GRAY, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Chọn loại thẻ (Card Type) dạng option */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card Type</Text>
            <View style={styles.optionRow}>
              {cardTypeOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.optionBtn,
                    type === opt && styles.optionBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setType(opt)}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      type === opt && styles.radioCircleActive,
                    ]}
                  />
                  <Text
                    style={{
                      color: type === opt ? Colors.GREEN : Colors.BLACK,
                      fontSize: 15,
                      marginLeft: 6,
                    }}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Nhập số thẻ */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Card Number"
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="number-pad"
              maxLength={19}
            />
          </View>
          {/* Nhập tháng/năm hết hạn (Expiry Date) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expiry Date</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {/* Nhập tháng MM */}
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="MM"
                placeholderTextColor={Colors.GRAY}
                value={month}
                onChangeText={(text) => {
                  // Chỉ cho nhập số, tối đa 2 ký tự, giá trị từ 1-12
                  const val = text.replace(/[^0-9]/g, "").slice(0, 2);
                  if (
                    val === "" ||
                    (parseInt(val) >= 1 && parseInt(val) <= 12)
                  ) {
                    setMonth(val);
                  }
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
              {/* Dấu / ngăn cách */}
              <Text
                style={{
                  alignSelf: "center",
                  fontSize: 16,
                  color: Colors.BLACK,
                }}
              >
                /
              </Text>
              {/* Nhập năm YYYY */}
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="YYYY"
                placeholderTextColor={Colors.GRAY}
                value={year}
                onChangeText={(text) => {
                  // Chỉ cho nhập số, tối đa 4 ký tự, validate lớn hơn năm hiện tại
                  const val = text.replace(/[^0-9]/g, "").slice(0, 4);
                  const now = new Date().getFullYear().toString();
                  let allow = true;
                  for (let i = 0; i < val.length && i < 4; i++) {
                    if (allow && val[i] < now[i]) {
                      allow = false;
                    }
                    if (val[i] > now[i]) {
                      break;
                    }
                  }
                  if (val === "" || allow) {
                    setYear(val);
                  }
                }}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
          </View>

          {/* Tuỳ chọn set default */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.defaultRow}
              activeOpacity={0.8}
              onPress={() => setIsDefault((prev) => !prev)}
            >
              <View
                style={[styles.checkbox, isDefault && styles.checkboxActive]}
              >
                {isDefault && <View style={styles.checkboxTick} />}
              </View>
              <Text style={styles.defaultLabel}>
                Set as default payment method
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nút xác nhận sửa phương thức thanh toán */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              !(type && cardNumber && expires) && { opacity: 0.5 },
            ]}
            onPress={handleSubmit}
            disabled={!(type && cardNumber && expires)}
          >
            <Text style={styles.submitBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default EditMethodModal;

const styles = StyleSheet.create({
  defaultRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.GRAY,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxActive: {
    borderColor: Colors.GREEN,
    backgroundColor: Colors.GREEN,
  },
  checkboxTick: {
    width: 10,
    height: 10,
    backgroundColor: Colors.WHITE,
    borderRadius: 2,
  },
  defaultLabel: {
    fontSize: 15,
    color: Colors.BLACK,
    fontFamily: "inter-regular",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 22,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
    backgroundColor: "#f8fafb",
  },
  submitBtn: {
    backgroundColor: Colors.GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontFamily: "inter-medium",
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 10,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    backgroundColor: "#f8fafb",
  },
  optionBtnActive: {
    borderColor: Colors.GREEN,
    backgroundColor: "#eafcf7",
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.GRAY,
    backgroundColor: "#fff",
  },
  radioCircleActive: {
    borderColor: Colors.GREEN,
    backgroundColor: Colors.GREEN,
  },
});
