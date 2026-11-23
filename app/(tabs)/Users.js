import useChat from "@/hooks/useChat";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"; // Icons ke liye
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createAudioPlayer } from "expo-audio";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import MyListItem from "../../components/MyListItem";
import NetworkBanner from "../../components/NetworkBanner";
import { API_URL } from "../../config/config";
import { useAuth } from "../../Context/AuthContext";
import { useSocket } from "../../Context/SocketContext";
import {
  fetchUnread,
  playMessageSound,
} from "../../components/APICallsForUsersPage";
dayjs.extend(relativeTime);

export default function UsersScreen() {
  const { isAtBottomRef, markAsRead, unreadCount } = useChat();
  const [users, setUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const { socket, currentChatUserId } = useSocket();
  const { user, logout, loading } = useAuth();

  console.log("user in user.js", user);

  const [loadingData, setLoadingData] = useState(true);
  // Agar aapne stringify kiya tha, to parse karna pare ga

  const playerRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      playerRef.current = createAudioPlayer(
        require("../../assets/sounds/msgRecieveSound.mp3"),
        { shouldPlay: true },
      );
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, []);

  const loadUnread = useCallback(async () => {
    try {
      const response = await fetchUnread(user?._id, loading);
      const unreadCountsMap = {};
      response.forEach((item) => {
        unreadCountsMap[item._id] = item.count;
      });
      setUnreadCounts(unreadCountsMap);
      console.log("Unread:", unreadCountsMap);
    } catch (error) {
      console.log("Unread count error:", error);
    }
  }, [loading, user?._id]);

  const userRef = useRef(user);

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((p) => p + 1);
    }, 60000);
    console.log("rerender");
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    if (loading || !user?._id) return;
    const handleReceiveMessage = async (message) => {
      console.log("Users Screen - New Message:", message);

      // Ignore messages not meant for this user
      if (message.receiverId !== user._id) return;

      setUsers((pre) => {
        return pre.map((user) => {
          if (user._id === message.senderId) {
            return {
              ...user,
              lastMessage: message.text,
              lastMessageTime: message.createdAt,
            };
          }
          return user;
        });
      });

      setUnreadCounts((prev) => ({
        ...prev,
        [message.senderId]: (prev[message.senderId] ?? 0) + 1,
      }));
      console.log("currentChatUserId", currentChatUserId);

      const isCurrentChatOpen = currentChatUserId === message.senderId;
      console.log("isCurrentChatOpen", isCurrentChatOpen);

      if (!isCurrentChatOpen) {
        await playMessageSound(playerRef);
        Toast.show({
          type: "success",
          text1: `${user?.name} || New Msg` || "New Message",
          text2: message.text,
          position: "top",
          visibilityTime: 3000,
        });
      }

      if (isCurrentChatOpen && isAtBottomRef.current && unreadCount > 0) {
        markAsRead();
      } else {
        //real time notification for sender for message recieve
        socket.emit("acknowledgeDelivery", {
          messageId: message._id,
          senderId: message.senderId,
        });
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [
    socket,
    currentChatUserId,
    unreadCount,
    markAsRead,
    isAtBottomRef,
    user?._id,
    user?.name,
  ]);

  useEffect(() => {
    if (!socket) return;
    socket.onAny((event, ...args) => {
      console.log("Socket Event:", event, args);
    });

    return () => {
      socket.offAny();
    };
  }, [socket]);

  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        loadUnread();
        console.log("useFocusEffect");
      }
    }, [loadUnread, user?._id]),
  );

  const fetchUsers = useCallback(async () => {
    if (loading || !user?._id) return;
    try {
      console.log(
        "Fetching users:",
        process.env.EXPO_PUBLIC_API_MOBILE + "/users",
      );
      const res = await axios.get(`${API_URL}/api/users/${user._id}`);
      setUsers(res.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoadingData(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleLogout = async () => {
    await logout();
    console.log("logout");
  };

  const renderItem = useCallback(
    ({ item }) => (
      <MyListItem
        item={item}
        unreadCount={unreadCounts[item._id] || 0}
        currentUserId={user?._id}
      />
    ),
    [unreadCounts, user?._id],
  );

  return (
    <SafeAreaView style={styles.container}>
      <NetworkBanner position="bottom" />
      {/* --- CUSTOM WHATSAPP HEADER --- */}
      <StatusBar backgroundColor="#075E54" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WhatsApp</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="camera-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <MaterialCommunityIcons
              name="dots-vertical"
              size={22}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- USER LIST --- */}
      {loadingData ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#075E54" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#075E54",
    height: 50,
    paddingTop: 5,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 5, // Android shadow
    boxShadow: "0px 2px 3.84px rgba(0, 0, 0, 0.25)",
  },
  headerTitle: { color: "white", fontSize: 22, fontWeight: "bold" },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  iconButton: { marginLeft: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
