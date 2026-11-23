import React from "react";
import { downloadImage } from "@/Utils/downloadImage";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  StatusBar,
} from "react-native";

interface ImageViewerProps {
  visible: boolean;
  imageUri: string | undefined;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  imageUri,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden={visible} />

      <View style={styles.container}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => {
            if (imageUri) {
              void downloadImage(imageUri);
            }
          }}
        >
          <Text style={styles.downloadText}>↓</Text>
        </TouchableOpacity>

        {/* Full Screen Image */}
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
  );
};

export default ImageViewer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  closeButton: {
    position: "absolute",
    top: 45,
    left: 20,
    zIndex: 10,
    padding: 10,
  },

  closeText: {
    color: "#fff",
    fontSize: 28,
  },

  image: {
    width: "100%",
    height: "100%",
  },
  downloadButton: {
    position: "absolute",
    top: 45,
    right: 20,
    zIndex: 10,
    padding: 12,
    backgroundColor: "#333",
    borderRadius: 30,
  },

  downloadText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },
});
