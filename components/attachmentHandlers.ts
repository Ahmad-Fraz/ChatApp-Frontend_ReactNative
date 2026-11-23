import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import { Platform, Alert } from "react-native";
import { uploadDocument } from "@/Utils/uploadDocument";

// =======================
// Gallery
// =======================

export const pickImageFromGallery = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    alert("Gallery permission denied");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,

    quality: 1,
  });

  if (!result.canceled) {
    console.log("Selected Image:", result.assets[0]);

    return result.assets[0];
  }
};

// =======================
// Camera
// =======================

export const openCamera = async () => {
  try {
    // ANDROID / IOS
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Denied", "Camera permission is required.");
        return null;
      }
    }

    // WEB + ANDROID + IOS
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.length > 0) {
      console.log("Captured Image:", result.assets[0]);

      return result.assets[0];
    }

    return null;
  } catch (error) {
    console.log("Camera Error:", error);
    Alert.alert("Camera Error", "Unable to open camera.");
    return null;
  }
};

// =======================
// Document Picker
// =======================

export const pickDocument = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
  });

  if (!result.canceled) {
    console.log("Document:", result.assets[0]);

    return result.assets[0];
  }
};

// =======================
// Location
// =======================

export const shareLocation = async () => {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    alert("Location permission denied");
    return;
  }

  const location = await Location.getCurrentPositionAsync({});

  console.log("Location:", location.coords);

  return location.coords;
};
