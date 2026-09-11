import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Gesture } from "react-native-gesture-handler";

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
  getStatusIcon,
}: Props) {
  const translateX = useSharedValue(0);

  const triggerReply = () => {
    onReplyPress(message);
  };

  const handleLongPress = () => {
    const actions: {
      text: string;
      onPress?: () => void;
      style?: "cancel" | "default" | "destructive";
    }[] = [
      {
        text: "Reply",
        onPress: () => onReplyPress(message),
      },
    ];
    console.log("message.text", message.text);
    if (message.type === "text" && message.text?.trim()) {
      actions.push({
        text: "Copy",
        onPress: async () => {
          await Clipboard.setStringAsync(message.text ?? "");
        },
      });
    }

    actions.push({
      text: "Cancel",
      style: "cancel",
    });

    Alert.alert("Message", undefined, actions);
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

  //const messageGesture = hLongPress();
  const handleLongPres = () => {
    console.log("LONG PRESS");

    Alert.alert("Message", "Long press working", [
      {
        text: "Reply",
        onPress: () => {
          console.log("REPLY PRESSED");
          onReplyPress(message);
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };
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

      <Pressable onLongPress={handleLongPres} delayLongPress={500}>
        <Animated.View
          style={[
            styles.renderItem,

            {
              alignSelf: isMe ? "flex-end" : "flex-start",

              backgroundColor: isHighlighted
                ? "#FFF3A3"
                : isMe
                  ? "#DCF8C6"
                  : "#FFFFFF",

              borderTopRightRadius: isMe ? 2 : 15,

              borderTopLeftRadius: isMe ? 15 : 2,
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
          />

          {/* TIME + STATUS */}

          {isMe && (
            <View style={styles.statusContainer}>
              <Text style={styles.timeText}>
                {new Date(message.createdAt).toLocaleTimeString()}
              </Text>

              {getStatusIcon(message.status)}
            </View>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  // No spacing here
  container: {
    position: "relative",
    width: "100%",
  },

  // Icon bubble ke peeche hai
  replyIconContainer: {
    position: "absolute",

    left: 18,

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
