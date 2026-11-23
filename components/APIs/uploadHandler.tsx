import { Platform } from "react-native";
import { API_URL } from "../../config/config";
import { authFetch } from "../../services/tokenVerificationService";

const uploadImage = async (image: any) => {
  const formData = new FormData();
  const mimeType = image.mimeType || "image/jpeg";

  const extension = mimeType.split("/")[1] || "jpg";

  const fileName = image.fileName || `image-${Date.now()}.${extension}`;

  if (Platform.OS === "web") {
    console.log("IMAGE URI:", image.uri);

    const response = await fetch(image.uri);

    const blob = await response.blob();

    if (!response.ok || !blob.type.startsWith("image/")) {
      throw new Error("Selected image URI did not return image data");
    }

    formData.append("file", blob, fileName);
  } else {
    formData.append("file", {
      uri: image.uri,

      name: fileName,

      type: mimeType,
    } as any);
  }

  const response = await authFetch(`${API_URL}/api/uploads/image`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Image upload failed: ${response.status}`);
  }

  const data = await response.json();

  return data; // 👈 server returns URL
};

export default uploadImage;
