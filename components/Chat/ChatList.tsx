import { chatService } from "@/services/chatService";
import { downloadImage, getImageUrl } from "@/Utils/downloadImage";
import { Message } from "@/types/message";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ListRenderItem,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import getStatusIcon from "../../components/GetStatusIcon";
import SwipeableMessage from "../../components/SwipeableMessage";

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
  shouldScrollToSentMessageRef: React.RefObject<boolean>;
  loadingMoreMsgs: boolean;
  newMessageCount: number;
}

export default React.memo(function ChatList({
  flatListRef,
  setReplyMessage,
  messages,
  shouldScrollToSentMessageRef,
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
  loadingMoreMsgs,
  newMessageCount,
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

  const [actionMenu, setActionMenu] = useState<{
    message: Message;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const chatListRef = useRef<View>(null);

  const highlightAfterScrollRef = useRef<string | null>(null);
  const hasHighlightedTargetRef = useRef(false);
  const [isReplyScrolling, setIsReplyScrolling] = useState(false);
  const viewableItemsRef = useRef<any[]>([]); // Store currently viewable items
  const backdropRef = useRef<View>(null);

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

    const isAtBottom = offsetY <= BOTTOM_THRESHOLD;
    isAtBottomRef.current = isAtBottom;

    // Show or hide the "New Messages" button based on scroll position
    setShowNewMsgBtn(!isAtBottom);
    // when user is at bottom then hide New msg btn and mark all msgs as read
    if (!wasAtBottom && isAtBottom && newMessageCount > 0) {
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
      setIsReplyScrolling(false);
      return;
    }

    if (loadingMoreRef.current) return;

    console.log("Loading older messages for reply target...");
    hasHighlightedTargetRef.current = false;
    loadMoreMessages();
  }, [messages, hasMore, loadMoreMessages, loadingMoreRef, flatListRef]);

  const highlightMessage = useCallback((messageId: string) => {
    hasHighlightedTargetRef.current = true;
    setHighlightedMessageId(messageId);
    setIsReplyScrolling(false);
    highlightAfterScrollRef.current = null;
    pendingReplyMessageIdRef.current = null;

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedMessageId(null);
      highlightTimeoutRef.current = null;
    }, 1500);
  }, []);

  useEffect(() => {
    console.log("HIGHLIGHT STATE CHANGED:", highlightedMessageId);
  }, [highlightedMessageId]);

  const scrollToMessage = useCallback(
    (messageId: string) => {
      console.log("TARGET:", messageId);

      pendingReplyMessageIdRef.current = messageId;
      highlightAfterScrollRef.current = messageId;
      hasHighlightedTargetRef.current = false;

      const isVisible = viewableItemsRef.current.some(
        (item) => item.item?._id === messageId,
      );

      // Already visible
      if (isVisible) {
        console.log("Target already visible");

        setHighlightedMessageId(messageId);
        highlightAfterScrollRef.current = null;
        hasHighlightedTargetRef.current = true;
        pendingReplyMessageIdRef.current = null;

        highlightMessage(messageId);
        return;
      }

      // Not visible → we actually need to scroll/load
      setIsReplyScrolling(true);

      const index = messegesRef.current.findIndex(
        (message) => message._id === messageId,
      );

      if (index !== -1) {
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        });

        return;
      }

      // Not loaded
      if (!loadingMoreRef.current && hasMore) {
        loadMoreMessages();
      }
    },
    [messegesRef, loadMoreMessages, hasMore],
  );

  const MENU_WIDTH = 120;
  const MENU_HEIGHT = 105;
  const MENU_GAP = 6;
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const getMenuPosition = () => {
    if (!actionMenu) return null;

    const { x, y, width, height } = actionMenu;

    const messageCenterX = x + width / 2;

    let menuX = messageCenterX - MENU_WIDTH / 2;

    // screen ke left se bahar na nikle
    menuX = Math.max(8, menuX);

    // screen ke right se bahar na nikle
    menuX = Math.min(screenWidth - MENU_WIDTH - 8, menuX);

    const spaceBelow = screenHeight - (y + height);

    const showBelow = spaceBelow >= MENU_HEIGHT + MENU_GAP;

    const menuY = showBelow
      ? y + height + MENU_GAP
      : y - MENU_HEIGHT - MENU_GAP;

    return {
      left: menuX,
      top: menuY,
    };
  };

  const getDate = (date: string | Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };

  const formatMessageDate = (date: string | Date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    if (getDate(messageDate) === getDate(today)) {
      return "Today";
    }

    if (getDate(messageDate) === getDate(yesterday)) {
      return "Yesterday";
    }

    return messageDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  const renderItem: ListRenderItem<Message> = useCallback(
    ({ item, index }) => {
      const isMe = item.senderId === userId;

      const nextMessage = messages[index + 1];
      const showDate =
        getDate(item.createdAt) !== getDate(nextMessage?.createdAt);

      return (
        <>
          <SwipeableMessage
            message={item}
            isMe={isMe}
            currentUserId={userId}
            otherUserName={receiverName}
            highlightedMessageId={highlightedMessageId}
            onReplyPress={setReplyMessage}
            onReplyPreviewPress={scrollToMessage}
            getStatusIcon={getStatusIcon}
            onLongPress={(message, position) => {
              setActionMenu({ message, ...position });
            }}
          />

          {showDate && (
            <View style={styles.dateSeparator}>
              <Text>{formatMessageDate(item.createdAt)}</Text>
            </View>
          )}
        </>
      );
    },
    [
      userId,
      receiverName,
      highlightedMessageId,
      setReplyMessage,
      scrollToMessage,
    ],
  );

  const [, setRefreshTime] = useState(0);
  useEffect(() => {
    console.log("TIMER EFFECT MOUNTED");

    const interval = setInterval(() => {
      setRefreshTime((prev) => prev + 1);
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

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
      const targetId = highlightAfterScrollRef.current; // Get the target message ID to highlight after scroll
      viewableItemsRef.current = viewableItems; // Update the ref with current viewable items

      if (!targetId) return;

      if (hasHighlightedTargetRef.current) return;

      const targetVisible = viewableItems.some(
        (item) => item.item?._id === targetId,
      );

      if (targetVisible) {
        highlightMessage(targetId);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10, // Message at least 10% screen par show ho
  }).current;

  backdropRef.current?.measureInWindow((x, y, width, height) => {
    console.log("BACKDROP:", {
      x,
      y,
      width,
      height,
    });
  });

  const loadingFooter = loadingMoreMsgs ? (
    <View>
      <ActivityIndicator size="small" />
    </View>
  ) : null;

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

      {isReplyScrolling && (
        <View style={styles.replyLoadingContainer}>
          <View style={styles.replyLoadingText}>
            <ActivityIndicator size="small" />
            <Text>Loading / finding message...</Text>
          </View>
        </View>
      )}

      {actionMenu && (
        <Pressable
          style={styles.menuBackdrop}
          ref={backdropRef}
          onPress={() => setActionMenu(null)}
        >
          <View style={[styles.actionsMenu, getMenuPosition()]}>
            <Pressable
              style={styles.actionItem}
              onPress={() => {
                const message = actionMenu.message;

                setActionMenu(null);
                setReplyMessage(message);
              }}
            >
              <Text style={styles.actionText}>↩ Reply</Text>
            </Pressable>

            {actionMenu.message.type === "image" &&
              actionMenu.message.image && (
                <Pressable
                  style={styles.actionItem}
                  onPress={() => {
                    const imageUrl = getImageUrl(actionMenu.message.image);

                    setActionMenu(null);
                    void downloadImage(imageUrl);
                  }}
                >
                  <Text style={styles.actionText}>⬇️ Download</Text>
                </Pressable>
              )}

            {actionMenu.message.type === "text" &&
              actionMenu.message.text?.trim() && (
                <Pressable
                  style={styles.actionItem}
                  onPress={async () => {
                    await Clipboard.setStringAsync(
                      actionMenu.message.text ?? "",
                    );

                    setActionMenu(null);
                  }}
                >
                  <Text style={styles.actionText}>📋 Copy</Text>
                </Pressable>
              )}

            {actionMenu.message.senderId === userId && (
              <Pressable
                style={styles.actionItem}
                onPress={async () => {
                  if (Platform.OS !== "web") {
                    Alert.alert(
                      "Delete Message",
                      "Are you sure you want to delete this message?",
                      [
                        {
                          text: "Cancel",
                          onPress: () => setActionMenu(null),
                          style: "cancel",
                        },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: async () => {
                            // temporary test
                            console.log(
                              "DELETE MESSAGE:",
                              actionMenu.message._id,
                            );
                            await chatService.deleteMessage(
                              actionMenu.message._id,
                            );
                            setActionMenu(null);
                          },
                        },
                      ],
                    );
                  } else {
                    const confirmDelete = window.confirm(
                      "Are you sure you want to delete this message?",
                    );
                    if (confirmDelete) {
                      // temporary test
                      console.log("DELETE MESSAGE:", actionMenu.message._id);
                      const res = await chatService.deleteMessage(
                        actionMenu.message._id,
                      );
                      console.log("DELETE STATUS:", res.status);
                      setActionMenu(null);
                    }
                  }
                }}
              >
                <Text style={styles.actionText}>🗑️ Delete</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      )}

      <View ref={chatListRef} style={{ flex: 1 }}>
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
          ListFooterComponent={loadingFooter}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onContentSizeChange={() => {
            if (shouldScrollToSentMessageRef.current) {
              shouldScrollToSentMessageRef.current = false;

              flatListRef.current?.scrollToOffset({
                offset: 0,
                animated: true,
              });
            }
          }}
        />
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  replyLoadingContainer: {
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  replyLoadingText: {
    backgroundColor: "#e5e5e5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
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
  menuBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    zIndex: 999,
  },

  actionsMenu: {
    position: "absolute",

    width: 135,

    backgroundColor: "#FFFFFF",
    borderRadius: 8,

    paddingVertical: 3,

    elevation: 8,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },

  actionItem: {
    height: 36,

    paddingHorizontal: 12,

    justifyContent: "center",
  },

  actionText: {
    fontSize: 14,
    color: "#222",
  },
  dateSeparator: {
    alignSelf: "center",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginVertical: 10,
  },
});
