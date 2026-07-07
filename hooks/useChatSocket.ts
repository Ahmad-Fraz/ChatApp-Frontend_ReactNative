import { useSocket } from "@/Context/SocketContext";
import { Message } from "@/types/message";
import React, { useEffect } from "react";

type SocketProps = {
  handleNewMessage: (msg: Message) => void;
  userId: string;
  isFocused: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  fetchMessages: () => void;
  flatListRef: React.RefObject<any>;
};

export function useChatSocket({
  handleNewMessage,
  userId,
  isFocused,
  setMessages,
  fetchMessages,
  flatListRef,
}: SocketProps) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    if (!userId || !isFocused) {
      return;
    } // ❗ important
    fetchMessages(); // ✅ 1. pehle API

    // PURANE LISTENERS KHATAM KAREIN (Zaroori!)
    socket.off("receiveMessage", handleNewMessage);
    socket.off("messageSentConfirm");
    socket.off("statusUpdateBulk");

    // receive message
    socket.on("receiveMessage", handleNewMessage);

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

      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });

    return () => {
      socket.off("receiveMessage", handleNewMessage);
      socket.off("messageSentConfirm");
      socket.off("statusUpdateBulk");
      socket.off("statusUpdate");
    };
  }, [userId, socket]);
}
