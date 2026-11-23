import { authFetch } from "../services/tokenVerificationService";
import { API_URL } from "@/config/config";
import { Platform } from "react-native";

export const uploadDocument = async (file: any) => {
  try {
    const formData = new FormData();

    if (Platform.OS === "web") {
      const response = await fetch(file.uri);

      if (!response.ok) {
        throw new Error("Unable to read document.");
      }

      const blob = await response.blob();
      console.log("DOCUMENT BLOB:", blob);
      if (blob.size === 0) {
        throw new Error("Document is empty.");
      }

      formData.append("file", blob, file.name);
    } else {
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
      } as any);
    }

    const response = await authFetch(`${API_URL}/api/uploads/document`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Document upload failed.");
    }

    const result = await response.json();

    console.log("UPLOADED DOCUMENT:", result);

    return result.document;
  } catch (error) {
    console.log("DOCUMENT UPLOAD ERROR:", error);
    throw error;
  }
};
