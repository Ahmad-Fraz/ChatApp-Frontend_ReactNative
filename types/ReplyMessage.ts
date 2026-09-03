export type MessageType = "text" | "image" | "document" | "location";
export interface ReplyMessage {
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

  location?: {
    longitude: number;
    latitude: number;
  };
}
