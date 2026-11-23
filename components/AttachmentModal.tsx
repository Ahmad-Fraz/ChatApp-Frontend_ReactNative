import { useSocket } from "@/Context/SocketContext";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import {
  openCamera,
  pickDocument,
  pickImageFromGallery,
  shareLocation,
} from "./attachmentHandlers";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useImageViewer } from "@/Context/ImageViewerContext";
import CameraCapture from "./CameraCapture";

type Props = {
  visible: boolean;
  onClose: () => void;
  receiverId: string; // Add this prop to receive the receiverId
};

type ActionButtonProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];

  label: string;

  bgColor: string;

  onPress: () => void;
};
const ActionButton = ({ icon, label, bgColor, onPress }: ActionButtonProps) => {
  return (
    <TouchableOpacity style={styles.actionContainer} onPress={onPress}>
      <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={icon} size={28} color="white" />
      </View>

      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function AttachmentModal({
  visible,
  onClose,
  receiverId,
}: Props) {
  const { openImagePreview, openDocumentPreview } = useImageViewer();
  const [showCamera, setShowCamera] = useState(false);

  return (
    <>
      <CameraCapture
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={(image) => {
          openImagePreview(image);
          setShowCamera(false);
        }}
      />

      <Modal
        isVisible={visible}
        onBackdropPress={onClose}
        style={styles.modal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.container}>
          <View style={styles.row}>
            <ActionButton
              icon="image"
              label="Gallery"
              bgColor="#4CAF50"
              onPress={async () => {
                const image = await pickImageFromGallery();
                if (!image) return;

                openImagePreview(image);

                onClose();
              }}
            />

            <ActionButton
              icon="camera"
              label="Camera"
              bgColor="#2196F3"
              onPress={async () => {
                setShowCamera(true);
                onClose();
              }}
            />

            <ActionButton
              icon="file-document"
              label="Document"
              bgColor="#FF9800"
              onPress={async () => {
                const file = await pickDocument();
                if (file) {
                  openDocumentPreview(file);
                  onClose();
                }
              }}
            />
          </View>

          <View style={styles.row}>
            <ActionButton
              icon="map-marker"
              label="Location"
              bgColor="#E91E63"
              onPress={async () => {
                const location = await shareLocation();

                console.log(location);

                onClose();
              }}
            />
            {/* 
          <ActionButton icon="account" label="Contact" bgColor="#9C27B0" />

          <ActionButton icon="music" label="Audio" bgColor="#009688" /> */}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },

  container: {
    backgroundColor: "white",
    paddingVertical: 25,
    paddingHorizontal: 20,

    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 25,
  },

  actionContainer: {
    alignItems: "center",
  },

  iconCircle: {
    width: 65,
    height: 65,
    borderRadius: 35,

    justifyContent: "center",
    alignItems: "center",

    elevation: 5,
  },

  label: {
    marginTop: 8,
    fontSize: 14,
    color: "#333",
  },
});
