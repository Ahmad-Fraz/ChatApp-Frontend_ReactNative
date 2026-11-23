import AttachmentModal from "@/components/AttachmentModal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ImageViewer from "@/components/ImageViewer";
import ChatList from "@/components/Chat/ChatList";
import useChat from "@/hooks/useChat";
import { useCallback, useEffect, useState } from "react";
import {
  Platform,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmojiKeyboard } from "rn-emoji-keyboard";
import AttachmentButton from "../../components/AttachmentButton";
import NetworkBanner from "../../components/NetworkBanner";
import { useLocalSearchParams } from "expo-router";
import { useImageViewer } from "@/Context/ImageViewerContext";
import { useSocket } from "@/Context/SocketContext";
import uploadImage from "../../components/APIs/uploadHandler";
import { uploadDocument } from "@/Utils/uploadDocument";
import DocumentViewer from "@/components/DocumentViewer/DocumentViewer";

export default function ChatScreen() {
  const [visible, setVisible] = useState(false);
  const { receiverId } = useLocalSearchParams();
  const [isSendingImage, setIsSendingImage] = useState(false);

  const openAttachmentModel = useCallback(() => {
    setVisible(true);
  }, []);

  const [docVisible, setDocVisible] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const {
    imageToSend,
    imageCaption,
    setImageCaption,
    openImagePreview,
    selectedImage,
    closeImage,
    closeImagePreview,
    documentToSend,
    closeDocumentPreview,
  } = useImageViewer();

  const { socket, user } = useSocket();

  useEffect(() => {
    console.log("Selected Image changed:", selectedImage);
  }, [selectedImage]);

  const [isSendingDocument, setIsSendingDocument] = useState(false);

  // Function to handle sending document message
  const handleSendDocument = async () => {
    if (!documentToSend || isSendingDocument) return;

    try {
      setIsSendingDocument(true);

      // Step 1: Upload document
      const uploadedDocument = await uploadDocument(documentToSend);

      // Step 2: Send document message through Socket.IO
      socket?.emit("sendMessage", {
        senderId: user?._id,
        receiverId,
        type: "document",
        document: uploadedDocument,
      });

      // Step 3: Clear document preview
      closeDocumentPreview();
    } catch (error) {
      console.log("SEND DOCUMENT ERROR:", error);
    } finally {
      setIsSendingDocument(false);
    }
  };

  // Function to handle sending image message
  const sendImageMessage = async () => {
    if (!imageToSend || !socket || !user?._id || !receiverId) {
      return;
    }

    try {
      setIsSendingImage(true);

      // STEP 1: Upload selected image
      const uploadedImg = await uploadImage(imageToSend);

      if (!uploadedImg?.image) {
        throw new Error("Image upload failed");
      }

      // STEP 2: Create message payload
      const payload = {
        senderId: user._id,
        receiverId,
        type: "image",
        image: uploadedImg.image.uri,
        text: imageCaption.trim(),
        ...(replyMessage && { replyTo: replyMessage._id }),
      };

      console.log("IMAGE MESSAGE PAYLOAD:", payload);
      console.log("UPLOADED IMAGE:", uploadedImg.image.uri);
      // STEP 3: Send through Socket.IO
      socket.emit("sendMessage", payload);

      // STEP 4: Clear preview
      closeImagePreview();
      setReplyMessage(null);
    } catch (error) {
      console.error("Image sending failed:", error);
      alert("Unable to send image. Please try again.");
    } finally {
      setIsSendingImage(false);
    }
  };

  const {
    setOpenEmojiPicker,
    sendMessage,
    loadingMoreRef,
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
    inputRef,
    markAsRead,
    unreadCount,
    handleTyping,
    receiverName,
    isTyping,
    isOnline,
    lastSeen,
    setReplyMessage,
    replyMessage,
    shouldScrollToSentMessageRef,
    newMessageCount,
    loadingMoreMsgs,
  } = useChat();

  useEffect(() => {
    if (replyMessage) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [replyMessage]);

  const handleSendPress = () => {
    if (documentToSend) {
      handleSendDocument();
    } else {
      sendMessage();
    }
  };

  return (
    <>
      <NetworkBanner position="top" />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <ChatList
            flatListRef={flatListRef}
            messages={messages}
            userId={userId}
            scrollTimeoutRef={scrollTimeoutRef}
            loadMoreMessages={loadMoreMessages}
            loadingMoreRef={loadingMoreRef}
            hasMore={hasMore}
            isAtBottomRef={isAtBottomRef}
            markAsRead={markAsRead}
            showNewMsgBtn={showNewMsgBtn}
            setShowNewMsgBtn={setShowNewMsgBtn}
            unreadCount={unreadCount}
            receiverName={receiverName}
            isTyping={isTyping}
            isOnline={isOnline}
            lastSeen={lastSeen}
            setReplyMessage={setReplyMessage}
            shouldScrollToSentMessageRef={shouldScrollToSentMessageRef}
            loadingMoreMsgs={loadingMoreMsgs}
            newMessageCount={newMessageCount}
          />

          <View>
            <ImageViewer
              visible={selectedImage !== undefined}
              imageUri={selectedImage}
              onClose={closeImage}
            />

            <DocumentViewer
              visible={docVisible}
              document={selectedDocument}
              onClose={() => {
                setDocVisible(false);
                setSelectedDocument(null);
              }}
            />

            {/* Reply Preview */}
            {replyMessage && (
              <View style={styles.replyPreview}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "bold" }}>
                    Replying to message
                  </Text>

                  <Text numberOfLines={1}>
                    {replyMessage.type === "text"
                      ? replyMessage.text
                      : replyMessage.type === "image"
                        ? "Photo"
                        : replyMessage.type === "document"
                          ? replyMessage.document?.name
                          : replyMessage.type === "location"
                            ? "Location"
                            : ""}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => setReplyMessage(null)}>
                  <Text>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Document Preview */}
            {documentToSend && (
              <View style={styles.documentPreview}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={35}
                  color="#FF9800"
                />

                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1}>{documentToSend.name}</Text>

                  <Text style={{ color: "#888", fontSize: 12 }}>
                    {(documentToSend.size / 1024).toFixed(2)} KB
                  </Text>
                </View>

                <TouchableOpacity onPress={closeDocumentPreview}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={24}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Single Chat Input Container */}
            <View style={styles.container}>
              {imageToSend ? (
                /* Image Preview */
                <View style={styles.imagePreviewContainer}>
                  <TouchableOpacity
                    style={styles.closePreviewBtn}
                    onPress={closeImagePreview}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color="#fff"
                    />
                  </TouchableOpacity>

                  <Image
                    source={{ uri: imageToSend.uri }}
                    style={styles.imagePreview}
                    resizeMode="contain"
                  />

                  <View style={styles.captionContainer}>
                    <TextInput
                      value={imageCaption}
                      onChangeText={setImageCaption}
                      placeholder="Add a caption..."
                      placeholderTextColor="#777"
                      style={styles.captionInput}
                      multiline
                    />

                    <TouchableOpacity
                      style={styles.imageSendBtn}
                      onPress={sendImageMessage}
                      disabled={isSendingImage}
                    >
                      <MaterialCommunityIcons
                        name={isSendingImage ? "loading" : "send"}
                        size={24}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  {/* Normal Text Input */}
                  <View style={styles.inputView}>
                    <TouchableOpacity
                      onPress={toggleEmojiPicker}
                      style={styles.emojiBtn}
                    >
                      <MaterialCommunityIcons
                        name={
                          openEmojiPicker
                            ? "keyboard-outline"
                            : "emoticon-outline"
                        }
                        size={28}
                        color="#555"
                      />
                    </TouchableOpacity>

                    <TextInput
                      style={[
                        styles.input as any,
                        Platform.OS === "web" ? { outlineStyle: "none" } : {},
                      ]}
                      ref={inputRef}
                      value={message}
                      placeholder="Type a message..."
                      onChangeText={handleTyping}
                      underlineColorAndroid="transparent"
                      onFocus={() => setOpenEmojiPicker(false)}
                    />

                    <AttachmentButton onPress={openAttachmentModel} />

                    {/* Web Send Button */}
                    {Platform.OS === "web" && (
                      <TouchableOpacity
                        onPress={handleSendPress}
                        disabled={isSendingDocument}
                        style={styles.sendBtnInside}
                      >
                        <MaterialCommunityIcons
                          name={isSendingDocument ? "loading" : "send"}
                          size={22}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Android Send Button */}
                  {Platform.OS !== "web" && (
                    <TouchableOpacity
                      onPress={handleSendPress}
                      disabled={isSendingDocument}
                      style={styles.sendBtnOutside}
                    >
                      <MaterialCommunityIcons
                        name={isSendingDocument ? "loading" : "send"}
                        size={24}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>

          {/* <CustomBottomSheet  /> */}

          <AttachmentModal
            visible={visible}
            onClose={() => setVisible(false)}
            receiverId={receiverId as string} // Pass the receiverId to the AttachmentModal
          />

          {openEmojiPicker && (
            <EmojiKeyboard
              onEmojiSelected={(emoji) => {
                setMessage((prev) => prev + emoji.emoji);
              }}
            />
          )}
          {showNewMsgBtn && (
            <TouchableOpacity
              onPress={() => {
                flatListRef.current?.scrollToOffset({
                  offset: 0,
                  animated: true,
                });
              }}
              style={styles.newMsgBtn}
            >
              <MaterialCommunityIcons
                name="chevron-double-down"
                size={28}
                color="#fff"
              />

              {newMessageCount > 0 && (
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: "bold",
                    marginTop: -4,
                  }}
                >
                  {newMessageCount}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
  },
  inputView: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 30,
    minHeight: 50,
    paddingHorizontal: 12,
  },

  emojiBtn: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#f0f0f0",
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: "#000",
  },

  sendBtnInside: {
    marginLeft: 8,
    backgroundColor: "#075E54",
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  sendBtnOutside: {
    marginLeft: 8,
    backgroundColor: "#075E54",
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },

  newMsgBtn: {
    position: "absolute",
    bottom: 80,
    right: 50,
    backgroundColor: "#25D366",
    width: 40,
    height: 40,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
  },
  imagePreviewContainer: {
    width: "100%",
    backgroundColor: "#202C33",
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  closePreviewBtn: {
    alignSelf: "flex-end",
    padding: 6,
    marginBottom: 8,
  },

  imagePreview: {
    width: "100%",
    height: 260,
    backgroundColor: "#111B21",
    borderRadius: 8,
  },

  captionContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingLeft: 16,
    paddingRight: 6,
    marginTop: 12,
    minHeight: 48,
  },

  captionInput: {
    flex: 1,
    color: "#222",
    fontSize: 15,
    paddingVertical: 10,
    maxHeight: 90,
  },

  imageSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#128C7E",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  documentPreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 10,
    marginBottom: 8,
    backgroundColor: "#F2F2F2",
    borderRadius: 10,
    gap: 10,
  },
  replyPreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderLeftWidth: 4,
    borderLeftColor: "#777",
  },
});
