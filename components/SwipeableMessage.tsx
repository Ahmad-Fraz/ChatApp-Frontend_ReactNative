import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Gesture, GestureDetector } from "react-native-gesture-handler";

import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Message } from "@/types/message";
import MessageBubble from "./MessageBubble";

type Props = {
  message: Message;
  isMe: boolean;
  currentUserId: string;
  otherUserName: string;
  highlightedMessageId: string | null;

  onReplyPress: (message: Message) => void;
  onReplyPreviewPress: (messageId: string) => void;
  onLongPress: (
    message: Message,
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
  ) => void;

  getStatusIcon: (status: Message["status"]) => React.ReactNode;
};

export default React.memo(function SwipeableMessage({
  message,
  isMe,
  currentUserId,
  otherUserName,
  highlightedMessageId,
  onReplyPress,
  onReplyPreviewPress,
  onLongPress,
  getStatusIcon,
}: Props) {
  const translateX = useSharedValue(0);

  const triggerReply = () => {
    onReplyPress(message);
  };

  const msgPosition = () => {
    messageRef.current?.measureInWindow((x, y, width, height) => {
      onLongPress(message, {
        x,
        y,
        width,
        height,
      });
    });
  };
  // =========================
  // SWIPE GESTURE
  // =========================

  const swipeGesture = Gesture.Pan()
    .activeOffsetX(20)
    .failOffsetY([-20, 20])

    .onUpdate((event) => {
      const x = Math.min(Math.max(event.translationX, 0), 80);

      translateX.value = x;
    })

    .onEnd((event) => {
      if (event.translationX >= 60) {
        runOnJS(triggerReply)();
      }

      translateX.value = withSpring(0, {
        damping: 18,
        stiffness: 180,
      });
    })

    .onFinalize(() => {
      translateX.value = withSpring(0, {
        damping: 18,
        stiffness: 180,
      });
    });

  // =========================
  // BUBBLE ANIMATION
  // =========================

  const bubbleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: translateX.value,
        },
      ],
    };
  });

  // =========================
  // ICON ANIMATION
  // =========================

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, 20, 60],
      [0, 0.4, 1],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      translateX.value,
      [0, 60],
      [0.5, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const isHighlighted = highlightedMessageId === message._id;

  const messageRef = useRef<View>(null);

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  //const messageGesture = hLongPress();
  return (
    // IMPORTANT:
    // Is wrapper mein koi margin/padding nahi
    <View style={styles.container}>
      {/* =========================
          REPLY ICON
      ========================= */}

      <Animated.View
        pointerEvents="none"
        style={[styles.replyIconContainer, iconAnimatedStyle]}
      >
        <Ionicons name="arrow-undo" size={20} color="#555" />
      </Animated.View>

      {/* =========================
          ACTUAL BUBBLE
      ========================= */}

      <GestureDetector gesture={swipeGesture}>
        <Pressable
          ref={messageRef}
          delayLongPress={500}
          style={{
            alignSelf: isMe ? "flex-end" : "flex-start",
            width: "auto",
          }}
          onLongPress={() => {
            // Get the position of the message bubble
            msgPosition();
          }}
        >
          <Animated.View
            style={[
              styles.renderItem,

              {
                backgroundColor: message.isDeleted
                  ? "transparent"
                  : isHighlighted
                    ? "#FFF3A3"
                    : isMe
                      ? "#DCF8C6"
                      : "#FFFFFF",

                borderTopRightRadius: message.isDeleted ? 15 : isMe ? 2 : 15,
                borderTopLeftRadius: message.isDeleted ? 15 : isMe ? 15 : 2,
              },

              bubbleAnimatedStyle,
            ]}
          >
            <MessageBubble
              message={message}
              onReplyPress={onReplyPress}
              currentUserId={currentUserId}
              otherUserName={otherUserName}
              onReplyPreviewPress={onReplyPreviewPress}
              onlongPress={msgPosition}
            />

            {/* TIME + STATUS */}

            {!message.isDeleted && (
              <View style={styles.statusContainer}>
                <Text style={styles.timeText}>{formattedTime}</Text>

                {isMe && getStatusIcon(message.status)}
              </View>
            )}
          </Animated.View>
        </Pressable>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  // No spacing here

  container: {
    position: "relative",
    width: "100%",
    zIndex: 1,
  },

  // Icon bubble ke peeche hai
  replyIconContainer: {
    position: "absolute",

    left: 50,

    top: 0,
    bottom: 0,

    width: 32,

    justifyContent: "center",
    alignItems: "center",

    zIndex: 0,
  },

  // YOUR ORIGINAL BUBBLE STYLING
  renderItem: {
    margin: 5,

    borderRadius: 10,

    paddingHorizontal: 12,
    paddingVertical: 8,

    marginHorizontal: 15,

    maxWidth: "80%",

    marginVertical: 4,

    elevation: 1,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 1,
    },

    shadowOpacity: 0.18,

    shadowRadius: 1.0,

    zIndex: 1,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",

    marginTop: 2,
  },

  timeText: {
    fontSize: 11,

    color: "rgba(0,0,0,0.45)",

    marginRight: 4,
  },
});
