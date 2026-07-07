import { API_URL } from "@/config/config";

export const chatService = {
  async fetchMessages(userId: string, receiverId: string) {
    const res = await fetch(
      `${API_URL}/api/messages?userId=${userId}&receiverId=${receiverId}`,
    );
    const data = await res.json();
    return data;
  },

  async FetchMoreMessages(userId: string, receiverId: string, oldest: string) {
    const res = await fetch(
      `${API_URL}/api/messages?userId=${userId}&receiverId=${receiverId}&before=${oldest}`,
    );
    const data = await res.json();
    return data;
  },

  async MarkAsRead(receiverId: string, userId: string) {
    const res = await fetch(`${API_URL}/api/messages/read/`, {
      method: "Put",
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
};
