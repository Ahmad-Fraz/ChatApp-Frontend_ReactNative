export type MessageType = "text" | "image" | "document" | "location";

export interface Message {
  _id: string;

  senderId: string;

  receiverId: string;

  type: MessageType;
  text?: string;

  image?: string;
  document?: {
    name: string;
    uri: string;
    type: string;
  };
  location?: { longitude: number; latitude: number };

  status: "sent" | "delivered" | "read";
  createdAt: string;
}
