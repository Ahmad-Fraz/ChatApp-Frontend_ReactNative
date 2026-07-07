import { Message } from "@/types/message";
import React, { useCallback } from "react";
import { FlatList, ListRenderItem, StyleSheet, Text, View } from "react-native";
import getStatusIcon from "../../components/GetStatusIcon";
import MessageBubble from "../../components/MessageBubble";

interface Props {
  flatListRef: React.RefObject<FlatList<Message> | null>;
  previousHeightRef: React.MutableRefObject<number>;
  oldContentHeightRef: React.MutableRefObject<number>;
  previousOffsetRef: React.MutableRefObject<number>;
  messages: Message[];
  restoredScrollRef: React.MutableRefObject<boolean>;
  userId: string;
  scrollTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  loadMoreMessages: () => void;
  loadingMoreRef: React.MutableRefObject<boolean>;
  hasMore: boolean;
}

export default React.memo(function ChatList({
  flatListRef,
  previousHeightRef,
  oldContentHeightRef,
  previousOffsetRef,
  messages,
  restoredScrollRef,
  userId,
  scrollTimeoutRef,
  loadMoreMessages,
  loadingMoreRef,
  hasMore,
}: Props) {
  // ... renderItem ke andar

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

    previousOffsetRef.current = contentOffset.y;

    previousHeightRef.current = contentSize.height;

    const distanceFromTop =
      contentSize.height - layoutMeasurement.height - contentOffset.y;

    const isNearTop = distanceFromTop < 300;

    if (isNearTop && !loadingMoreRef.current && hasMore) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        loadMoreMessages();
      }, 300);
    }
  };

  const renderItem: ListRenderItem<Message> = useCallback(
    ({ item }) => {
      const isMe = item.senderId === userId;

      return (
        <View
          style={[
            styles.renderItem,
            {
              alignSelf: isMe ? "flex-end" : "flex-start",
              backgroundColor: isMe ? "#DCF8C6" : "#fff",

              borderTopRightRadius: isMe ? 2 : 15, // WhatsApp style tail
              borderTopLeftRadius: isMe ? 15 : 2,
            },
          ]}
        >
          <MessageBubble message={item} />

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
    [userId],
  );

  return (
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
      onContentSizeChange={(w, h) => {
        if (loadingMoreRef.current && !restoredScrollRef.current) {
          restoredScrollRef.current = true;

          const heightDiff = h - oldContentHeightRef.current;

          requestAnimationFrame(() => {
            flatListRef.current?.scrollToOffset({
              offset: previousOffsetRef.current + heightDiff,
              animated: false,
            });

            loadingMoreRef.current = false;
          });
        }
      }}
    />
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
});
