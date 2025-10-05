import { Colors } from "@/constant/Colors";
import React, { useEffect, useState } from "react";
import { Animated, Image, Modal, StyleSheet, View } from "react-native";

const LoadingModal = ({ visible }: { visible: boolean }) => {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => {
        if (prev === 3) return 0;
        return prev + 1;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* <ActivityIndicator size="large" /> */}
          <Image
            source={require("@/assets/images/Loading/Travel.gif")}
            style={styles.loadAsset}
          />
          {/* Animated Loading Text */}
          <Animated.Text style={styles.text}>
            {`Loading${".".repeat(dotCount)}`}
          </Animated.Text>
        </View>
      </View>
    </Modal>
  );
};

export default LoadingModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    borderRadius: 10,
    // flexDirection: "row",
    // alignItems: "center",
    // justifyContent: "flex-start",
    width: 150,
  },
  loadAsset: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
  },
  text: {
    marginLeft: 26,
    fontSize: 16,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
  },
});
