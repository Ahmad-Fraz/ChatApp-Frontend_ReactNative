import { Platform } from "react-native";
import { API_URL } from "../../config/config";

const uploadImage = async (image: any) => {
  const formData = new FormData();
  const fileName = image.fileName || `image-${Date.now()}.jpg`;

  const mimeType = image.mimeType || "image/jpeg";

  if (Platform.OS === "web") {
    const response = await fetch(image.uri);

    const blob = await response.blob();

    formData.append("file", blob, fileName);
  } else {
    formData.append("file", {
      uri: image.uri,

      name: fileName,

      type: mimeType,
    } as any);
  }

  const response = await fetch(`${API_URL}/api/uploads/image`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  return data; // 👈 server returns URL
};

export default uploadImage;
