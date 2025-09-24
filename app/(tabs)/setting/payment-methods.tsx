import AddMethodModal from "@/components/Setting/PaymentMethod/AddMethodModal";
import EditMethodModal from "@/components/Setting/PaymentMethod/EditMethodModal";
import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const statusBarHeight = Constants.statusBarHeight;

// Dummy payment methods data, replace with API data later
// Số thẻ là full, khi hiển thị chỉ lấy 4 số cuối
const initialPaymentMethods = [
  {
    id: "1",
    type: "Visa",
    cardNumber: "4111111111114242",
    expires: "12/2026",
    isDefault: true,
  },
  {
    id: "2",
    type: "Mastercard",
    cardNumber: "5555555555558888",
    expires: "12/2026",
    isDefault: false,
  },
];

// Main Payment Methods screen
const PaymentMethods = () => {
  const router = useRouter();
  // State quản lý danh sách phương thức thanh toán
  const [methods, setMethods] = useState(initialPaymentMethods);
  // State điều khiển modal thêm mới
  const [showAddModal, setShowAddModal] = useState(false);
  // State điều khiển modal sửa
  const [showEditModal, setShowEditModal] = useState(false);
  // State lưu phương thức đang sửa
  const [editingMethod, setEditingMethod] = useState<
    | {
        id: string;
        type: string;
        cardNumber: string;
        expires: string;
        isDefault?: boolean;
      }
    | undefined
  >(undefined);

  // Mở modal thêm phương thức
  const handleAddMethod = () => {
    setShowAddModal(true);
  };

  // Xử lý khi submit modal thêm mới
  const handleSubmitAdd = (data: {
    type: string;
    cardNumber: string;
    expires: string;
  }) => {
    // Thêm phương thức mới vào danh sách (có thể call API ở đây)
    setMethods((prev) => [
      ...prev,
      {
        id: (prev.length + 1).toString(),
        type: data.type,
        cardNumber: data.cardNumber,
        expires: data.expires,
        isDefault: false,
      },
    ]);
  };

  // Mở modal sửa, truyền dữ liệu cần sửa
  const handleEdit = (id: string) => {
    const method = methods.find((m) => m.id === id);
    setEditingMethod(method);
    setShowEditModal(true);
  };

  // Xử lý khi submit modal sửa
  // Xử lý khi submit modal sửa, cập nhật logic set default
  const handleSubmitEdit = (data: {
    id: string;
    type: string;
    cardNumber: string;
    expires: string;
    isDefault: boolean;
  }) => {
    setMethods((prev) => {
      // Nếu chọn set default, các phương thức khác sẽ isDefault=false
      if (data.isDefault) {
        return prev.map((item) =>
          item.id === data.id
            ? {
                ...item,
                type: data.type,
                cardNumber: data.cardNumber,
                expires: data.expires,
                isDefault: true,
              }
            : { ...item, isDefault: false }
        );
      } else {
        // Nếu không chọn default, chỉ cập nhật dữ liệu
        return prev.map((item) =>
          item.id === data.id
            ? {
                ...item,
                type: data.type,
                cardNumber: data.cardNumber,
                expires: data.expires,
                isDefault: false,
              }
            : item
        );
      }
    });
  };

  // Xử lý xoá phương thức thanh toán
  const handleDelete = (id: string) => {
    // Nếu tích hợp API, gọi API xoá ở đây
    // Sau khi xoá thành công, cập nhật lại danh sách
    setMethods((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header row with title and Add button */}
      <View style={styles.headerContainer}>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackBtn}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.BLACK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pay Options</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddMethod}>
          <Ionicons
            name="add"
            size={20}
            color={Colors.WHITE}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.addBtnText}>Add Method</Text>
        </TouchableOpacity>
      </View>

      {/* Payment methods list */}
      <ScrollView
        contentContainerStyle={styles.card}
        showsVerticalScrollIndicator={false}
      >
        {methods.map((item, idx) => (
          <View key={item.id} style={styles.methodRow}>
            {/* Card icon */}
            <Ionicons
              name="card-outline"
              size={24}
              color={Colors.GRAY}
              style={{ marginRight: 16 }}
            />
            {/* Info */}
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 2,
                }}
              >
                {/* Hiển thị 4 số cuối của thẻ */}
                <Text style={styles.methodTitle}>{item.type}</Text>
                {item.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.methodTitle}>
                •••• {item.cardNumber.slice(-4)}
              </Text>
              <Text style={styles.methodDesc}>Expires {item.expires}</Text>
            </View>
            {/* Edit & Delete buttons */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => handleEdit(item.id)}
                style={styles.iconBtn}
              >
                <Ionicons name="create-outline" size={20} color={Colors.GRAY} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={styles.iconBtn}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.RED} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal thêm phương thức mới */}
      <AddMethodModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmitAdd}
      />
      {/* Modal sửa phương thức thanh toán */}
      <EditMethodModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSubmitEdit}
        method={editingMethod}
      />
    </View>
  );
};

export default PaymentMethods;

// Styles for Payment Methods screen
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: statusBarHeight + 12,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#9c9c9c1e",
  },
  headerTitle: {
    marginLeft: 12,
    fontSize: 22,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.GREEN,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  addBtnText: {
    color: Colors.WHITE,
    fontSize: 13,
    fontFamily: "inter-regular",
  },
  card: {
    borderRadius: 16,
    margin: 18,
    shadowColor: Colors.BLACK,
    flexGrow: 1,
  },
  methodRow: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    // marginRight: 8,
  },
  methodDesc: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  defaultBadge: {
    backgroundColor: "#c6f7e2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 8,
  },
  defaultBadgeText: {
    color: Colors.GREEN,
    fontSize: 13,
    fontFamily: "inter-medium",
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
  },
});
