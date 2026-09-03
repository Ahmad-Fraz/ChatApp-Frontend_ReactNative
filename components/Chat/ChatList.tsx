import { Message } from "@/types/message";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import getStatusIcon from "../../components/GetStatusIcon";
import MessageBubble from "../../components/MessageBubble";
dayjs.extend(relativeTime);

interface Props {
  flatListRef: React.RefObject<FlatList<Message> | null>;

  messages: Message[];

  userId: string;
  scrollTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  loadMoreMessages: () => void;
  loadingMoreRef: React.MutableRefObject<boolean>;
  hasMore: boolean;
  isAtBottomRef: React.MutableRefObject<boolean>;
  markAsRead: () => Promise<void>;
  showNewMsgBtn: boolean;
  setShowNewMsgBtn: React.Dispatch<React.SetStateAction<boolean>>;
  unreadCount: number;
  receiverName: string;
  isTyping: boolean;
  isOnline: boolean;
  lastSeen: number | null;
  setReplyMessage: React.Dispatch<React.SetStateAction<Message | null>>;
}

export default React.memo(function ChatList({
  flatListRef,
  setReplyMessage,
  messages,

  userId,
  scrollTimeoutRef,
  loadMoreMessages,
  loadingMoreRef,
  hasMore,
  isAtBottomRef,
  markAsRead,
  showNewMsgBtn,
  setShowNewMsgBtn,
  unreadCount,
  receiverName,
  isTyping,
  isOnline,
  lastSeen,
}: Props) {
  // ... renderItem ke andar
  const messegesRef = React.useRef<Message[]>([]);
  const navigation = useNavigation();
  const pendingReplyMessageIdRef = useRef<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);

  const highlightAfterScrollRef = useRef<string | null>(null);
  const hasHighlightedTargetRef = useRef(false);

  //Be always Synced wiht Latest Messages
  useEffect(() => {
    messegesRef.current = messages;
  }, [messages]);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

    const distanceFromTop =
      contentSize.height - layoutMeasurement.height - contentOffset.y;

    const isNearTop = distanceFromTop < 300;

    const BOTTOM_THRESHOLD = 200;
    const offsetY = event.nativeEvent.contentOffset.y;

    const wasAtBottom = isAtBottomRef.current;

    // console.log({
    //   offset: contentOffset.y,
    //   contentHeight: contentSize.height,
    //   viewport: layoutMeasurement.height,
    //   distanceFromTop,
    // });
    //auto true-false logic
    const isAtBottom = offsetY <= BOTTOM_THRESHOLD;
    isAtBottomRef.current = isAtBottom;

    // when user is at bottom then hide New msg btn and mark all msgs as read
    setShowNewMsgBtn(!isAtBottom);

    if (!wasAtBottom && isAtBottom && unreadCount > 0) {
      /*
      This CODE will execute when:
      The user was reading older messages.
      They manually scrolled back to the latest messages.
      There are unread messages waiting.
      Mark them all as read.
    */
      markAsRead();
    }

    if (isNearTop && !loadingMoreRef.current && hasMore) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        loadMoreMessages();
      }, 300);
    }
  };

  // 1. useEffect for checking message presence and auto-scrolling
  useEffect(() => {
    const targetId = pendingReplyMessageIdRef.current;
    if (!targetId) return;

    const index = messages.findIndex((message) => message._id === targetId);

    // Case A: Target message array me mil gaya
    if (index !== -1) {
      console.log("Reply target found at index:", index);

      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
        // Clear target only after scroll request is issued
        pendingReplyMessageIdRef.current = null;
      });
      return;
    }

    // Case B: Target nahi mila -> Database se check karke load karo
    if (!hasMore) {
      console.log("No more messages available");
      pendingReplyMessageIdRef.current = null;
      highlightAfterScrollRef.current = null;
      return;
    }

    if (loadingMoreRef.current) return;

    console.log("Loading older messages for reply target...");
    hasHighlightedTargetRef.current = false;
    loadMoreMessages();
  }, [messages, hasMore, loadMoreMessages, loadingMoreRef, flatListRef]);

  useEffect(() => {
    console.log("HIGHLIGHT STATE CHANGED:", highlightedMessageId);
  }, [highlightedMessageId]);

  const scrollToMessage = useCallback(
    (messageId: string) => {
      const index = messegesRef.current.findIndex(
        (message) => message._id === messageId,
      );

      pendingReplyMessageIdRef.current = messageId;

      highlightAfterScrollRef.current = messageId;
      hasHighlightedTargetRef.current = false;

      console.log("3 target:", messageId);
      console.log("4 index:", index);
      // Tapped Message already loaded
      if (index !== -1) {
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
        return;
      }

      console.log("highlight state SET:", messageId);
      // Not loaded
      loadMoreMessages();
      console.log("Target not loaded. Need older messages.");
    },
    [messegesRef, flatListRef, loadMoreMessages],
  );

  const renderItem: ListRenderItem<Message> = useCallback(
    ({ item }) => {
      const isMe = item.senderId === userId;
      const isHighlighted = highlightedMessageId === item._id;
      if (isHighlighted)
        console.log("RENDER MESSAGE:", item._id, "HIGHLIGHT:", isHighlighted);
      return (
        <View
          style={[
            styles.renderItem,
            {
              alignSelf: isMe ? "flex-end" : "flex-start",
              backgroundColor:
                highlightedMessageId === item._id
                  ? "#FFF3A3"
                  : isMe
                    ? "#DCF8C6"
                    : "#fff",

              borderTopRightRadius: isMe ? 2 : 15, // WhatsApp style tail
              borderTopLeftRadius: isMe ? 15 : 2,
            },
          ]}
        >
          <MessageBubble
            message={item}
            onReplyPress={setReplyMessage}
            currentUserId={userId}
            otherUserName={receiverName}
            onReplyPreviewPress={scrollToMessage}
          />

          {/* ================= FOOTER (TIME + STATUS) ================= */}
          {isMe && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
                marginTop: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: "rgba(0,0,0,0.45)",
                  marginRight: 4,
                }}
              >
                {new Date(item.createdAt).toLocaleTimeString()}
              </Text>
              {getStatusIcon(item.status)}
            </View>
          )}
        </View>
      );
    },
    [
      userId,
      receiverName,
      setReplyMessage,
      scrollToMessage,
      highlightedMessageId,
    ],
  );

  let statusText = "";

  if (isTyping) {
    statusText = "Typing...";
  } else if (isOnline) {
    statusText = "Online";
  } else if (lastSeen) {
    statusText = dayjs(lastSeen).fromNow();
  } else {
    statusText = "";
  }

  // 3. Fallback when FlatList hasn't measured target height yet
  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      console.log("scrollToIndex failed:", info);

      const approximateOffset = info.averageItemLength * info.index;

      // Jump to estimated offset so FlatList renders target items
      flatListRef.current?.scrollToOffset({
        offset: approximateOffset,
        animated: false,
      });

      // Retry precise scroll after rendering layout frame
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: info.index,
            animated: true,
            viewPosition: 0.5,
          });
        }
      }, 100);
    },
    [flatListRef],
  );
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      const targetId = highlightAfterScrollRef.current;

      if (!targetId) return;

      if (hasHighlightedTargetRef.current) return;

      const targetVisible = viewableItems.some(
        (item) => item.item?._id === targetId,
      );

      if (!targetVisible) return;

      console.log("TARGET ACTUALLY VISIBLE:", targetId);

      // Prevent highlighting the same target multiple times
      hasHighlightedTargetRef.current = true;

      // Highlight
      setHighlightedMessageId(targetId);

      // Target reached
      highlightAfterScrollRef.current = null;
      pendingReplyMessageIdRef.current = null;

      // Remove previous timeout if one exists
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }

      // Auto remove highlight
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedMessageId(null);
        highlightTimeoutRef.current = null;
      }, 1500);
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10, // Message at least 10% screen par show ho
  }).current;

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.userName}>{receiverName}</Text>

          <Text style={styles.userStatus}>
            <Text style={styles.userStatus}>{statusText}</Text>
          </Text>
        </View>
      </View>

      <FlatList
        data={messages}
        onEndReachedThreshold={0.2}
        renderItem={renderItem}
        inverted
        maintainVisibleContentPosition={{
          minIndexForVisible: 1,
        }}
        keyExtractor={(item) => item._id}
        ref={flatListRef}
        onScroll={handleScroll}
        removeClippedSubviews={true}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </>
  );
});

const styles = StyleSheet.create({
  renderItem: {
    margin: 5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 15,
    maxWidth: "80%",
    marginVertical: 4,
    // Add shadow/elevation taake bubbles thode uthe hue lagein
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  header: {
    height: 60,
    backgroundColor: "#075E54",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  backButton: {
    marginRight: 10,
  },

  headerText: {
    flex: 1,
  },

  userName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  userStatus: {
    color: "#d5f5e3",
    fontSize: 12,
  },
});
