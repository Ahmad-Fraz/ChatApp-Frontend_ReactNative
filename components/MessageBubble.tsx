import { Image, Text, TouchableOpacity, View } from "react-native";

import { API_URL } from "@/config/config";
import { Message } from "@/types/message";
import React from "react";

type Props = {
  message: Message;
};

export default React.memo(function MessageBubble({ message }: Props) {
  // =======================
  // TEXT
  // =======================

  if (message.type === "text") {
    return (
      <View>
        <Text>{message.text}</Text>
      </View>
    );
  }

  // =======================
  // IMAGE
  // =======================

  if (message.type === "image") {
    console.log("Rendering image with URL:", `${API_URL}${message.image}`);
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

  // =======================
  // DOCUMENT
  // =======================

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

  // =======================
  // LOCATION
  // =======================

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
});
