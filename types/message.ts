import { ReplyMessage } from "./ReplyMessage";

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
    size: number;
  };
  location?: { longitude: number; latitude: number };
  isDeleted: boolean;
  deletedAt: string | null;

  status: "sent" | "delivered" | "read";
  replyTo?: ReplyMessage | null;
  createdAt: string;
}
