import { useSocket } from "@/Context/SocketContext";
import { Message } from "@/types/message";
import React, { useEffect } from "react";

type SocketProps = {
  handleNewMessage: (msg: Message) => void;
  userId: string;
  receiverId: string;
  isFocused: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  fetchMessages: () => void;
  flatListRef: React.RefObject<any>;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOnline: React.Dispatch<React.SetStateAction<boolean>>;
  setLastSeen: React.Dispatch<React.SetStateAction<number | null>>;
  shouldScrollToSentMessageRef: React.RefObject<boolean>;
};

export function useChatSocket({
  handleNewMessage,
  userId,
  receiverId,
  isFocused,
  setMessages,
  fetchMessages,
  flatListRef,
  setIsTyping,
  setIsOnline,
  setLastSeen,
  shouldScrollToSentMessageRef,
}: SocketProps) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    if (!userId || !isFocused) {
      return;
    } // ❗ important
    fetchMessages();

    socket.emit("getPresence", {
      userId: receiverId,
    });

    // PURANE LISTENERS KHATAM KAREIN (Zaroori!)
    socket.off("receiveMessage", handleNewMessage);
    socket.off("messageSentConfirm");
    socket.off("statusUpdateBulk");
    socket.off("typing");
    socket.off("stopTyping");

    // receive message
    socket.on("receiveMessage", handleNewMessage);

    socket.on("userOnline", ({ userId }) => {
      if (userId === receiverId) {
        setIsOnline(true);

        setLastSeen(null);
      }
    });

    socket.on("userOffline", ({ userId, lastSeen }) => {
      console.log("userOffline event received:", { userId, lastSeen });
      if (userId === receiverId) {
        setIsOnline(false);

        setLastSeen(lastSeen);
      }
    });

    socket.on("presence", ({ userId, online, lastSeen }) => {
      if (userId !== receiverId) return;

      setIsOnline(online);
      setLastSeen(lastSeen);
    });

    socket.on("typing", ({ senderId }) => {
      if (senderId === receiverId) {
        setIsTyping(true);
      }
    });

    socket.on("stopTyping", ({ senderId }) => {
      if (senderId === receiverId) {
        setIsTyping(false);
      }
    });

    //Update the sender for msg read
    socket.on("statusUpdateBulk", ({ senderId, status }) => {
      setMessages((pre) =>
        pre.map((msg) =>
          msg.senderId === senderId ? { ...msg, status } : msg,
        ),
      );
    });

    socket.on("statusUpdate", ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg._id) === String(messageId) ? { ...msg, status } : msg,
        ),
      );
    });

    //after adding msg to DB update UI
    socket.on("messageSentConfirm", (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        if (exists) return prev;
        return [msg, ...prev];
      });

      shouldScrollToSentMessageRef.current = true;
    });

    //Update UI after deleting msg from DB
    socket.on("messageDeleted", (updatedMessage) => {
      console.log("messageDeleted event received:", updatedMessage);
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg._id) === String(updatedMessage._id) ? updatedMessage : msg,
        ),
      );
    });

    return () => {
      socket.off("receiveMessage", handleNewMessage);
      socket.off("messageSentConfirm");
      socket.off("statusUpdateBulk");
      socket.off("statusUpdate");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("presence");
      socket.off("messageDeleted");
      socket.off("userOnline");
      socket.off("userOffline");
    };
  }, [userId, socket, fetchMessages, handleNewMessage, isFocused, setIsTyping]);
}
