import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Colors } from "@/constant/Colors";
import { MultipleSelectList } from "react-native-dropdown-select-list";

const ListInterests = [
  { key: "food", value: "Ẩm Thực" },
  { key: "nature", value: "Thiên Nhiên" },
  { key: "hiking", value: "Leo núi" },
  { key: "mountain-climbing", value: "Chinh phục núi" },
  { key: "culture", value: "Văn hoá" },
  { key: "history", value: "Lịch sử" },
  { key: "shop", value: "Mua sắm" },
  { key: "adventure", value: "Phiêu lưu" },
  { key: "entertainment", value: "Giải trí" },
];

const Step4 = ({
  interests,
  setInterests,
}: {
  interests: string[];
  setInterests: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.contentTitle}>Bạn quan tâm đến điều gì nhất?</Text>
      <Text style={styles.contentSubtitle}>
        Chọn nhiều danh mục để cá nhân hóa các gợi ý du lịch của bạn
      </Text>

      <View>
        <MultipleSelectList
          setSelected={(val: string[]) => setInterests(val)}
          data={ListInterests}
          save="value"
          // onSelect={() => console.log(interests)}
          label="Categories"
          inputStyles={{ fontFamily: "inter-medium", color: Colors.BLACK }}
          dropdownTextStyles={{
            fontFamily: "inter-medium",
            color: Colors.BLACK,
          }}
        />
      </View>
    </View>
  );
};

export default Step4;

const styles = StyleSheet.create({
  contentTitle: {
    fontSize: 18,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    textAlign: "center",
    marginBottom: 6,
  },
  contentSubtitle: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "center",
    marginBottom: 20,
  },
});
