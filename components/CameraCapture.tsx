import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCapture: (image: any) => void;
}

export default function CameraCapture({ visible, onClose, onCapture }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const takePicture = async () => {
    if (!cameraRef.current || !cameraReady || capturing) return;

    try {
      setCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
      });

      if (photo?.uri) {
        const image = {
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          fileName: `camera-${Date.now()}.jpg`,
          mimeType: "image/jpeg",
        };

        onCapture(image);
        onClose();
      }
    } catch (error) {
      console.log("Capture error:", error);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {!permission?.granted ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.text}>Camera permission is required.</Text>

            <TouchableOpacity style={styles.button} onPress={requestPermission}>
              <Text style={styles.buttonText}>Allow Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose}>
              <Text style={styles.text}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              onCameraReady={() => setCameraReady(true)}
            />

            {!cameraReady && (
              <ActivityIndicator
                size="large"
                color="white"
                style={styles.loader}
              />
            )}

            <View style={styles.controls}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={takePicture}
                disabled={!cameraReady || capturing}
                style={styles.captureButton}
              >
                {capturing ? <ActivityIndicator color="black" /> : null}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  controls: {
    height: 110,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "black",
  },
  captureButton: {
    width: 65,
    height: 65,
    borderRadius: 40,
    backgroundColor: "white",
    borderWidth: 5,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    padding: 12,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  text: {
    color: "white",
    margin: 15,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loader: {
    position: "absolute",
    top: "45%",
    alignSelf: "center",
  },
});
