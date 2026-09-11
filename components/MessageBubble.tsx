import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";

import { API_URL } from "@/config/config";
import { Message } from "@/types/message";
import React from "react";

type Props = {
  message: Message;
  onReplyPress?: (message: Message) => void;
  currentUserId: string;
  onReplyPreviewPress?: (messageId: string) => void;
  otherUserName: string;
};

export default React.memo(function MessageBubble({
  message,
  onReplyPress,
  currentUserId,
  onReplyPreviewPress,
  otherUserName,
}: Props) {
  const renderContent = () => {
    // TEXT
    if (message.type === "text") {
      return (
        <View>
          <Text>{message.text}</Text>
        </View>
      );
    }

    // IMAGE
    if (message.type === "image") {
      return (
        <Image
          source={{
            uri: `${API_URL}${message.image}`,
          }}
          style={{
            width: 220,
            height: 220,
            borderRadius: 12,
          }}
          resizeMode="cover"
        />
      );
    }

    // DOCUMENT
    if (message.type === "document") {
      return (
        <TouchableOpacity
          style={{
            padding: 12,
            backgroundColor: "#eee",
            borderRadius: 10,
          }}
        >
          <Text>📄 {message.document?.name}</Text>
        </TouchableOpacity>
      );
    }

    // LOCATION
    if (message.type === "location") {
      return (
        <View
          style={{
            padding: 15,
            backgroundColor: "#ddd",
            borderRadius: 10,
          }}
        >
          <Text>📍 Location Shared</Text>

          <Text>{message.location?.latitude}</Text>
          <Text>{message.location?.longitude}</Text>
        </View>
      );
    }

    return null;
  };

  const renderReplyPreview = () => {
    if (!message.replyTo) {
      return null;
    }

    const replySenderName =
      message.replyTo.senderId === currentUserId ? "You" : otherUserName;

    return (
      <Pressable
        onPress={() => {
          if (message.replyTo) {
            onReplyPreviewPress?.(message.replyTo._id);
          }
        }}
        style={{
          padding: 8,
          marginBottom: 5,
          backgroundColor: "#e5e5e5",
          borderLeftWidth: 3,
          borderLeftColor: "#777",
          borderRadius: 6,
        }}
      >
        <Text
          style={{
            fontWeight: "bold",
            marginBottom: 2,
          }}
        >
          {replySenderName}
        </Text>

        {message.replyTo.type === "text" && (
          <Text numberOfLines={1}>{message.replyTo.text}</Text>
        )}

        {message.replyTo.type === "image" && <Text>📷 Photo</Text>}

        {message.replyTo.type === "document" && (
          <Text numberOfLines={1}>📄 {message.replyTo.document?.name}</Text>
        )}

        {message.replyTo.type === "location" && <Text>📍 Location</Text>}
      </Pressable>
    );
  };

  return (
    <View>
      {renderReplyPreview()}
      {renderContent()}
    </View>
  );
});
