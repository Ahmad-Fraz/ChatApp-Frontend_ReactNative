import {
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
} from "react-native";
import { getImageUrl } from "@/Utils/downloadImage";
import { API_URL } from "@/config/config";
import { Message } from "@/types/message";
import React, { useRef } from "react";
import { useImageViewer } from "@/Context/ImageViewerContext";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Linking } from "react-native";

type Props = {
  message: Message;
  onReplyPress?: (message: Message) => void;
  currentUserId: string;
  onReplyPreviewPress?: (messageId: string) => void;
  otherUserName: string;
  onlongPress?: () => void;
};

export default React.memo(function MessageBubble({
  message,
  onReplyPress,
  currentUserId,
  onReplyPreviewPress,
  otherUserName,
  onlongPress,
}: Props) {
  const { openImage } = useImageViewer();
  const imageUrl = getImageUrl(message.image);

  console.log("MESSAGE BUBBLE:", {
    type: message.type,
    image: message.image,
    id: message._id,
  });

  console.log("IS IMAGE MESSAGE:", message.type === "image" && !!message.image);

  const renderContent = () => {
    if (message.isDeleted) {
      return (
        <View style={styles.deletedMessage}>
          <Ionicons name="ban-outline" size={16} color="#888" />

          <Text style={styles.deletedText}>
            {message.text || "This message was deleted."}
          </Text>
        </View>
      );
    }
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
        <View style={styles.imageMessageContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            delayLongPress={500}
            onPress={() => openImage(imageUrl)}
            onLongPress={onlongPress}
          >
            <Image
              source={{ uri: imageUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            {message.text?.trim() ? (
              <Text style={styles.imageCaption}>{message.text}</Text>
            ) : null}
          </TouchableOpacity>
        </View>
      );
    }

    // DOCUMENT
    if (message.type === "document") {
      const filename = message.document?.name;
      const fileExtension = filename?.split(".").pop()?.toLowerCase();
      const documentUrl = getImageUrl(message.document?.uri);

      const openDocument = async () => {
        if (!documentUrl) return;

        try {
          if (Platform.OS === "web") {
            window.open(documentUrl, "_blank");
          } else {
            await Linking.openURL(documentUrl);
          }
        } catch (error) {
          console.log("OPEN DOCUMENT ERROR:", error);
        }
      };

      let icon = "file-document-outline"; // Default icon
      let bgColor = "#ccc"; // Default background color

      switch (fileExtension) {
        case "pdf":
          icon = "file-pdf-box";
          bgColor = "#E53935"; // Red for PDF
          break;
        case "doc":
        case "docx":
          icon = "file-word-box";
          bgColor = "#1E88E5"; // Blue for Word
          break;
        case "xls":
        case "xlsx":
          icon = "file-excel-box";
          bgColor = "#43A047"; // Green for Excel
          break;
        case "ppt":
        case "pptx":
          icon = "file-powerpoint-box";
          bgColor = "#FF9800"; // Orange for PowerPoint
          break;
        default:
          icon = "file-document-outline";
          bgColor = "#757575"; // Grey for other file types
          break;
      }

      const formatFileSize = (sizeInBytes: number) => {
        if (sizeInBytes < 1024) {
          return `${sizeInBytes} B`;
        } else if (sizeInBytes < 1024 * 1024) {
          return `${(sizeInBytes / 1024).toFixed(2)} KB`;
        } else if (sizeInBytes < 1024 * 1024 * 1024) {
          return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
        } else {
          return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        }
      };

      return (
        <View style={styles.docBubble}>
          <TouchableOpacity style={styles.docMain}>
            <MaterialCommunityIcons
              name={icon as any}
              size={24}
              color={bgColor}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} ellipsizeMode="tail">
                {message.document?.name}
              </Text>
              <Text>
                {message.document?.size
                  ? formatFileSize(message.document.size)
                  : ""}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Right-side open button */}
          <TouchableOpacity onPress={openDocument} style={styles.docOpenButton}>
            <MaterialCommunityIcons name="download" size={20} color="#555" />
          </TouchableOpacity>
        </View>
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

const styles = StyleSheet.create({
  imageCaption: {
    marginTop: 5,
    fontSize: 14,
    color: "#555",
    paddingHorizontal: 5,
  },
  messageImage: {
    width: 200,
    height: 200,
    maxWidth: "100%",
    borderRadius: 10,
  },
  imageMessageContainer: {
    maxWidth: 250,
    padding: 5,
  },
  deletedMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#E5E5E5",
  },

  deletedText: {
    color: "#777",
    fontSize: 13,
    fontStyle: "italic",
  },

  docBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 10,
    width: 250,
    maxWidth: "100%",
  },

  docMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  docOpenButton: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
});
