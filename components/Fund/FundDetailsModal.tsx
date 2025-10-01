// Modal hiển thị chi tiết contributors và lịch sử giao dịch của quỹ
import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Kiểu dữ liệu cho contributor và lịch sử giao dịch
export type ContributorType = {
  id: string;
  name: string;
  amount: number;
  type: "deposit" | "withdraw";
  date: string;
};

// Props cho modal chi tiết quỹ
export type FundDetailsModalProps = {
  visible: boolean;
  onClose: () => void;
  fundName: string;
  contributors: ContributorType[];
  totalRaised: number;
  totalContributors: number;
};

// Component modal hiển thị danh sách contributors và lịch sử giao dịch
const FundDetailsModal = ({
  visible,
  onClose,
  fundName,
  contributors,
  totalRaised,
  totalContributors,
}: FundDetailsModalProps) => {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header modal: tên quỹ và nút đóng */}
          <View style={styles.header}>
            <Text style={styles.title}>{fundName} - Contributors</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.GRAY} />
            </TouchableOpacity>
          </View>
          {/* Danh sách contributors và lịch sử giao dịch */}
          <FlatList
            data={[...contributors].reverse()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.date}>{item.date}</Text>
                </View>
                <Text
                  style={[
                    styles.amount,
                    item.type === "deposit" ? styles.deposit : styles.withdraw,
                  ]}
                >
                  {item.type === "deposit" ? "+" : "-"}$
                  {item.amount.toLocaleString("en-US")}
                </Text>
              </View>
            )}
            ListFooterComponent={
              // Tổng số contributors và tổng tiền đã raise
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Total: {totalContributors} contributors
                </Text>
                <Text style={styles.footerText}>
                  {`$${totalRaised.toLocaleString("en-US")}`} raised
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

export default FundDetailsModal;

// Style cho modal và các thành phần bên trong
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    minHeight: 340,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  name: {
    fontSize: 15,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  date: {
    fontSize: 12,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontFamily: "inter-medium",
    marginLeft: 8,
  },
  deposit: {
    color: Colors.GREEN,
  },
  withdraw: {
    color: Colors.RED,
  },
  footer: {
    marginTop: 12,
    alignItems: "flex-start",
  },
  footerText: {
    fontSize: 14,
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    marginTop: 2,
  },
});
