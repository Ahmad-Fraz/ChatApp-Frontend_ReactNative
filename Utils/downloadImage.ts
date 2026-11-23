import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import Toast from "react-native-toast-message";
import { API_URL } from "@/config/config";

const getFileName = (url: string) => {
  try {
    const pathname = new URL(url).pathname;
    const name = decodeURIComponent(
      pathname.substring(pathname.lastIndexOf("/") + 1),
    );

    return name || `image_${Date.now()}.jpg`;
  } catch {
    return `image_${Date.now()}.jpg`;
  }
};
export const getImageUrl = (image?: string) => {
  if (!image || typeof image !== "string") return "";

  // Already complete URL
  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("blob:") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  const baseUrl = API_URL?.replace(/\/+$/, "");

  const imagePath = image.replace(/^\/+/, "");

  const finalUrl = `${baseUrl}/${imagePath}`;

  console.log("IMAGE URL:", finalUrl);

  return finalUrl;
};

export const downloadImage = async (imageUrl: string) => {
  try {
    if (!imageUrl) {
      throw new Error("Image URL is missing.");
    }

    const fileName = getFileName(imageUrl);

    // WEB DOWNLOAD
    if (Platform.OS === "web") {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("Unable to fetch image.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);

      Toast.show({
        type: "success",
        text1: "Download Started",
      });

      return;
    }

    // ANDROID / IOS DOWNLOAD
    const cacheDirectory = FileSystem.cacheDirectory;

    if (!cacheDirectory) {
      throw new Error("Cache directory unavailable.");
    }

    const localUri = `${cacheDirectory}${Date.now()}_${fileName}`;

    const result = await FileSystem.downloadAsync(imageUrl, localUri);

    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Download failed: ${result.status}`);
    }

    const permission = await MediaLibrary.requestPermissionsAsync(true, [
      "photo",
    ]);

    if (!permission.granted) {
      throw new Error("Photo library permission denied.");
    }

    await MediaLibrary.saveToLibraryAsync(result.uri);

    Toast.show({
      type: "success",
      text1: "Image Saved",
      text2: "Image saved to your gallery.",
    });
  } catch (error) {
    console.error("Image Download Error:", error);

    Toast.show({
      type: "error",
      text1: "Download Failed",
      text2: "Unable to save image.",
    });
  }
};
