import { API_URL } from "@/config/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authFetch } from "./tokenVerificationService";

export const chatService = {
  async fetchMessages(userId: string, receiverId: string) {
    const res = await authFetch(
      `${API_URL}/api/messages?userId=${userId}&receiverId=${receiverId}`,
    );
    const data = await res.json();
    return data;
  },

  async FetchMoreMessages(userId: string, receiverId: string, oldest: string) {
    const res = await authFetch(
      `${API_URL}/api/messages?userId=${userId}&receiverId=${receiverId}&before=${oldest}`,
    );
    const data = await res.json();
    return data;
  },

  async MarkAsRead(receiverId: string, userId: string) {
    const res = await authFetch(`${API_URL}/api/messages/read/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: receiverId,
        receiverId: userId,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to mark messages as read");
    }
    return res.json();
  },

  async deleteMessage(messageId: string) {
    console.log("Deleting message with ID:", messageId);
    const res = await authFetch(`${API_URL}/api/messages/delete/${messageId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Response from delete request:", res);
    return res.json();
  },
};
