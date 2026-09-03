import { useSocket } from "@/Context/SocketContext";
import { chatService } from "@/services/chatService";
import { Message } from "@/types/message";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Keyboard, TextInput } from "react-native";
import { useChatSocket } from "./useChatSocket";

export default function useChat() {
  // Context and Hooks
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  // Params

  const { userId, receiverId, receiverName } = useLocalSearchParams<{
    userId: string;
    receiverId: string;
    receiverName: string;
  }>();
  // States

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const { socket, setCurrentChatUserId } = useSocket();
  const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);
  const [openEmojiPicker, setOpenEmojiPicker] = useState(false);

  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  //Refs for pagination and scroll position
  const flatListRef = useRef<FlatList<Message>>(null);
  const isFirstRender = useRef(true);
  const isAtBottomRef = useRef(true);

  const loadingMoreRef = useRef(false);

  const inputRef = useRef<TextInput>(null);
  const paginationCooldownRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  useEffect(() => {
    console.log("replyMessage:", replyMessage);
  }, [replyMessage]);
  const handleTyping = (text: string) => {
    setMessage(text);

    if (!socket) return;
    // If the user removes all text, emit stopTyping and reset the typing state
    if (text.trim() === "") {
      if (isTypingRef.current) {
        socket.emit("stopTyping", {
          senderId: userId,
          receiverId,
        });

        isTypingRef.current = false;
      }

      setMessage(text);
      return;
    }

    // Emit only once when typing starts
    if (!isTypingRef.current) {
      socket.emit("typing", {
        senderId: userId,
        receiverId,
      });

      isTypingRef.current = true;
    }

    // Restart stop timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", {
        senderId: userId,
        receiverId: receiverId,
      });
      isTypingRef.current = false;
      typingTimeoutRef.current = null;
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Optional: ensure receiver doesn't keep seeing "Typing..."
      if (socket && isTypingRef.current) {
        socket.emit("stopTyping", {
          senderId: userId,
          receiverId,
        });
      }
    };
  }, [socket, userId, receiverId]);

  // Fetch messages function
  const fetchMessages = useCallback(async () => {
    try {
      const data = await chatService.fetchMessages(userId, receiverId);
      setMessages(data);
    } catch (err) {
      console.log(err);
    }
  }, [userId, receiverId]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      setCurrentChatUserId(null);
    });

    return unsubscribe;
  }, [navigation, setCurrentChatUserId]);

  useEffect(() => {
    if (isFocused) {
      setCurrentChatUserId(receiverId);
    } else {
      setCurrentChatUserId(null);
    }
  }, [isFocused, receiverId, setCurrentChatUserId]);

  //when there are many masages and read them all on screen load
  const markAsRead = useCallback(async () => {
    if (isMarkingRead) return;
    if (!socket) return;
    setIsMarkingRead(true);

    try {
      await chatService.MarkAsRead(receiverId, userId);

      if (isAtBottomRef.current) {
        // 🔥 ADD THIS
        socket.emit("markAsRead", {
          senderId: receiverId,
          receiverId: userId,
        });
      } else {
        // ❗ visible نہیں → unread increment
        setShowNewMsgBtn(true);
      }
    } catch (error) {
      console.error("Mark as read error:", error);
    } finally {
      setTimeout(() => setIsMarkingRead(false), 500);
    }
  }, [isMarkingRead, socket, receiverId, userId]);

  const unreadCount = useMemo(() => {
    return messages.filter(
      (message) =>
        message.senderId === receiverId &&
        message.receiverId === userId &&
        message.status !== "read",
    ).length;
  }, [messages, receiverId, userId]);

  // marks all existing unread messages as read on screen load.
  useEffect(() => {
    if (!socket) return;
    if (!userId || !receiverId || !messages || messages.length === 0) {
      return;
    }
    console.log("unreadCount:", unreadCount);
    if (unreadCount > 0) {
      markAsRead();
    }
  }, [receiverId, userId, unreadCount, socket, messages, markAsRead]);

  useEffect(() => {
    console.log("messages changed");
  }, [messages]);

  // Handle New Socket Message
  const handleNewMessage = useCallback(
    (msg: Message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        if (exists) return prev;
        return [msg, ...prev];
      });
      //Verify that the message belongs to the currently open chat:
      if (msg.senderId === receiverId && msg.receiverId === userId) {
        if (isAtBottomRef.current) {
          // ✅ auto mark as read
          markAsRead();
          // ✅ auto scroll
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }, 100);
        } else {
          setShowNewMsgBtn(true);
        }
      }
    },
    [markAsRead, receiverId, userId],
  );

  const [isTyping, setIsTyping] = useState(false);
  // 🔥 Hooking up the Socket Event Sub-Hook
  useChatSocket({
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
  });

  const sendMessage = () => {
    if (!socket) return;
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    socket.emit("sendMessage", {
      senderId: userId,
      receiverId,
      type: "text", // ✅ ADD THIS
      text: trimmedMessage,
      ...(replyMessage && { replyTo: replyMessage._id }),
    });

    setMessage("");
    setReplyMessage(null);
  };

  const loadMoreMessages = async () => {
    if (
      loading ||
      paginationCooldownRef.current ||
      !hasMore ||
      messages.length === 0
    ) {
      return;
    }

    loadingMoreRef.current = true;
    paginationCooldownRef.current = true;

    setLoading(true);

    try {
      const oldest = messages[messages.length - 1].createdAt;

      const data = await chatService.FetchMoreMessages(
        userId,
        receiverId,
        oldest,
      );

      if (data.length === 0) {
        setHasMore(false);
      } else {
        setMessages((prev) => {
          const newMsgs = data.filter(
            (msg: Message) => !prev.some((p) => p._id === msg._id),
          );
          return [...prev, ...newMsgs];
        });
      }
    } catch (error) {
      console.error("Load more failed:", error);
    } finally {
      paginationCooldownRef.current = false;
      setLoading(false);
      loadingMoreRef.current = false;
    }
  };

  const toggleEmojiPicker = () => {
    if (openEmojiPicker) {
      // CLOSE emoji → OPEN keyboard
      setOpenEmojiPicker(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // OPEN emoji → CLOSE keyboard
      Keyboard.dismiss();
      setOpenEmojiPicker(true);
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!openEmojiPicker) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [openEmojiPicker]);

  return {
    messages,
    message,
    setMessage,
    flatListRef,
    userId,
    scrollTimeoutRef,
    loadMoreMessages,
    hasMore,
    openEmojiPicker,
    toggleEmojiPicker,
    isAtBottomRef,
    showNewMsgBtn,
    setShowNewMsgBtn,
    markAsRead,
    inputRef,
    loadingMoreRef,
    sendMessage,
    setOpenEmojiPicker,
    unreadCount,
    handleTyping,
    receiverName,
    isTyping,
    isOnline,
    lastSeen,
    setReplyMessage,
    replyMessage,
  };
}
