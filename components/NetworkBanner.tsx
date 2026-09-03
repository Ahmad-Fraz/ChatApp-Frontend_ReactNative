import { MaterialCommunityIcons } from "@expo/vector-icons"; // Ya jo bhi icon library aap use kar rahe hain
import { Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useNetwork } from "../Context/NetworkProvider";

type NetworkBannerProps = {
  position?: "top" | "bottom";
};

export default function NetworkBanner({
  position = "top",
}: NetworkBannerProps) {
  const { isConnected } = useNetwork(); // Context mein value agar sirf boolean hai to {} nahi lagayein
  console.log("Banner Component Status:", isConnected);
  if (isConnected) return null;

  return (
    <View
      style={[
        styles.container,
        position === "top" ? styles.top : styles.bottom,
      ]}
    >
      {/* SafeAreaView taake Notch ke niche na chhupay */}
      <SafeAreaView>
        <View style={styles.content}>
          <MaterialCommunityIcons name="wifi-off" size={20} color="#fff" />
          <Text style={styles.text}>Waiting for network connection...</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FF5252", // Pyara red (Coral Red)
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9999, // Taake sab ke upar nazar aaye
    elevation: 5, // Android shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 10,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  },
  bottom: {
    bottom: 0,
  },
  top: {
    top: 0,
  },
});
