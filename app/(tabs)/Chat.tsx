import AttachmentModal from "@/components/AttachmentModal";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useCallback, useState } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmojiKeyboard } from "rn-emoji-keyboard";
import AttachmentButton from "../../components/AttachmentButton";

import ChatList from "@/components/Chat/ChatList";
import useChat from "@/hooks/useChat";
export default function ChatScreen() {
  const [visible, setVisible] = useState(false);

  const openAttachmentModel = useCallback(() => {
    setVisible(true);
  }, []);

  const {
    setOpenEmojiPicker,
    setShouldFocusInput,
    sendMessage,
    loadingMoreRef,
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
  } = useChat();

  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={80}
        >
          <ChatList
            flatListRef={flatListRef}
            messages={messages}
            previousHeightRef={previousHeightRef}
            oldContentHeightRef={oldContentHeightRef}
            previousOffsetRef={previousOffsetRef}
            restoredScrollRef={restoredScrollRef}
            userId={userId}
            scrollTimeoutRef={scrollTimeoutRef}
            loadMoreMessages={loadMoreMessages}
            loadingMoreRef={loadingMoreRef}
            hasMore={hasMore}
          />

          <View style={styles.container}>
            <View style={styles.inputView}>
              <TouchableOpacity
                onPress={toggleEmojiPicker}
                style={styles.emojiBtn}
              >
                <MaterialCommunityIcons
                  name={
                    openEmojiPicker ? "keyboard-outline" : "emoticon-outline"
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
                onChangeText={setMessage}
                underlineColorAndroid="transparent"
                onFocus={() => {
                  setOpenEmojiPicker(false);
                }}
              />

              <AttachmentButton onPress={openAttachmentModel} />

              {/* WEB SEND BTN INSIDE */}

              {Platform.OS === "web" && (
                <TouchableOpacity
                  onPress={sendMessage}
                  style={styles.sendBtnInside}
                >
                  <MaterialCommunityIcons name="send" size={22} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* MOBILE SEND BTN OUTSIDE */}

            {Platform.OS !== "web" && (
              <TouchableOpacity
                onPress={sendMessage}
                style={styles.sendBtnOutside}
              >
                <MaterialCommunityIcons name="send" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          {/* <CustomBottomSheet  /> */}
          {visible && (
            <AttachmentModal
              visible={visible}
              onClose={() => setVisible(false)}
            />
          )}
          {openEmojiPicker && (
            <EmojiKeyboard
              onEmojiSelected={(emoji) => {
                setMessage((prev) => prev + emoji.emoji);
                setShouldFocusInput(true);
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
                setShowNewMsgBtn(false);
              }}
              style={styles.newMsgBtn}
            >
              <MaterialCommunityIcons
                name="chevron-double-down"
                size={28}
                color="#fff"
              />
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
    right: 20,
    backgroundColor: "#25D366",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
  },
});
