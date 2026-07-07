import { useSocket } from "@/Context/SocketContext";
import { chatService } from "@/services/chatService";
import { Message } from "@/types/message";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Keyboard, TextInput } from "react-native";
import { useChatSocket } from "./useChatSocket";

export default function useChat() {
  // Context and Hooks
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  // Params

  const { userId, receiverId } = useLocalSearchParams<{
    userId: string;
    receiverId: string;
  }>();

  // States

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const { socket, setCurrentChatUserId } = useSocket();
  const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);
  const [openEmojiPicker, setOpenEmojiPicker] = useState(false);
  const [shouldFocusInput, setShouldFocusInput] = useState(false);

  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  //Refs for pagination and scroll position
  const flatListRef = useRef<FlatList<Message>>(null);
  const isFirstRender = useRef(true);
  const isAtBottomRef = useRef(true);
  const previousHeightRef = useRef(0);
  const previousOffsetRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const oldContentHeightRef = useRef(0);
  const restoredScrollRef = useRef(false);
  const inputRef = useRef<TextInput>(null);
  const paginationCooldownRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch messages function
  const fetchMessages = async () => {
    try {
      const data = await chatService.fetchMessages(userId, receiverId);
      setMessages(data);
    } catch (err) {
      console.log(err);
    }
  };

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
  }, [navigation]);

  useEffect(() => {
    if (isFocused) {
      setCurrentChatUserId(receiverId);
    } else {
      setCurrentChatUserId(null);
    }
  }, [isFocused, receiverId]);

  const unreadCount = useMemo(() => {
    return messages.filter(
      (message) =>
        message.senderId === receiverId &&
        message.receiverId === userId &&
        message.status !== "read",
    ).length;
  }, [messages, receiverId, userId]);

  useEffect(() => {
    if (!socket) return;
    if (!userId || !receiverId || !messages || messages.length === 0) {
      return;
    }

    if (unreadCount > 0) {
      markAsRead();
    }
  }, [receiverId, userId, unreadCount]);

  // Handle New Socket Message
  const handleNewMessage = (msg: Message) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m._id === msg._id);
      if (exists) return prev;
      return [msg, ...prev];
    });

    if (msg.senderId === receiverId && msg.receiverId === userId) {
      //working only on db
      markAsRead();
    }

    if (isAtBottomRef.current) {
      // ✅ auto scroll
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } else {
      // ❗ show button
      setShowNewMsgBtn(true);
    }
  };

  // 🔥 Hooking up the Socket Event Sub-Hook
  useChatSocket({
    handleNewMessage,
    userId,
    isFocused,
    setMessages,
    fetchMessages,
    flatListRef,
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
    });

    setMessage("");
  };

  const loadMoreMessages = async () => {
    if (loading || paginationCooldownRef.current || !hasMore) return;

    restoredScrollRef.current = false;
    loadingMoreRef.current = true;

    paginationCooldownRef.current = true;

    oldContentHeightRef.current = previousHeightRef.current;

    setLoading(true);

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
    setTimeout(() => {
      paginationCooldownRef.current = false;
    }, 1200);
    setLoading(false);
  };

  //when there are many masages and read them all on screen load
  const markAsRead = async () => {
    if (isMarkingRead) return;
    if (!socket) return;
    setIsMarkingRead(true);

    try {
      await chatService.MarkAsRead(receiverId, userId);
    } catch (error) {
      console.error("Mark as read error:", error);
    } finally {
      setTimeout(() => setIsMarkingRead(false), 500);
    }

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
    previousHeightRef,
    oldContentHeightRef,
    previousOffsetRef,
    restoredScrollRef,
    userId,
    scrollTimeoutRef,
    loadMoreMessages,
    hasMore,
    openEmojiPicker,
    toggleEmojiPicker,

    showNewMsgBtn,
    setShowNewMsgBtn,
    inputRef,
    loadingMoreRef,
    sendMessage,
    setOpenEmojiPicker,
    setShouldFocusInput,
  };
}
