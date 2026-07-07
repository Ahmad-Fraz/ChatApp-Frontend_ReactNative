import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"; // Icons ke liye
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createAudioPlayer } from "expo-audio";
import { router, useFocusEffect, usePathname } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import NetworkBanner from "../../components/NetworkBanner";
import { API_URL } from "../../config/config";
import { useAuth } from "../../Context/AuthContext";
import { useSocket } from "../../Context/SocketContext";

dayjs.extend(relativeTime);

export default function UsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const { socket, currentChatUserId } = useSocket();
  const { user, logout } = useAuth();
  const pathname = usePathname();

  console.log("user", user);
  const [loading, setLoading] = useState(true);
  // Agar aapne stringify kiya tha, to parse karna pare ga

  const playMessageSound = async () => {
    try {
      if (Platform.OS === "web") {
        console.log("playing sound");
        const audio = new window.Audio("sounds\\sound.mp3");
        await audio.play();
        return;
      } else {
        const player = createAudioPlayer(
          require("../../assets/sounds/sound.mp3"),
        );

        player.play();
      }
    } catch (err) {
      console.log("Sound Error:", err);
    }
  };

  const fetchUnread = async () => {
    try {
      console.log(
        "Fetching users from Unread:",
        process.env.EXPO_PUBLIC_API_MOBILE + "/users",
      );
      const res = await axios.get(`${API_URL}/api/messages/unread/${user._id}`);
      console.log("Unread Raw Data:", res.data);
      return res.data;
    } catch (error) {
      console.error("Axios Error:", error);
      return [];
    }
  };

  const loadUnread = useCallback(async () => {
    try {
      const response = await fetchUnread();
      const unreadCountsMap = {};
      response.forEach((item) => {
        unreadCountsMap[item._id] = item.count;
      });
      setUnreadCounts(unreadCountsMap);
      console.log("Unread:", unreadCountsMap);
    } catch (error) {
      console.log("Unread count error:", error);
    }
  }, []);

  const userRef = useRef(user);
  const loadUnreadRef = useRef(loadUnread);

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
    loadUnreadRef.current = loadUnread;
  }, [loadUnread]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = async (message) => {
      console.log("Users Screen - New Message:", message);

      let user_;
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
        await playMessageSound();
        Toast.show({
          type: "success",
          text1: `${user.name} || New Msg` || "New Message",
          text2: message.text,
          position: "top",
          visibilityTime: 3000,
        });
      }

      //real time notification for sender for message recieve
      socket.emit("acknowledgeDelivery", {
        messageId: message._id,
        senderId: message.senderId,
      });
    };

    console.log("Client Socket ID:", socket.id);
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [socket]);

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
    }, [loadUnread]),
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLogout = async () => {
    await logout();
    console.log("logout");
  };

  const fetchUsers = async () => {
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
      setLoading(false);
    }
  };

  const MyListItem = React.memo(({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/Chat",
          params: { userId: user._id, receiverId: item._id },
        })
      }
      style={styles.userCard}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.name}</Text>

          {unreadCounts[item._id] > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCounts[item._id]}</Text>
            </View>
          )}

          <Text style={styles.timeText}>
            {item.lastMessageTime ? dayjs(item.lastMessageTime).fromNow() : ""}
          </Text>
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>
          {item.lastMessage || "No messages yet"}
        </Text>
      </View>
    </TouchableOpacity>
  ));

  return (
    <SafeAreaView style={styles.container}>
      <NetworkBanner />

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
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#075E54" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <MyListItem item={item} />}
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
  userCard: { flexDirection: "row", padding: 15, alignItems: "center" },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: "#128C7E",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  userInfo: {
    flex: 1,
    marginLeft: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    paddingBottom: 15,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  userName: { fontSize: 17, fontWeight: "bold" },
  timeText: { fontSize: 12, color: "#25D366" }, // WhatsApp Green color
  userEmail: { fontSize: 14, color: "#666" },

  badge: {
    backgroundColor: "green",
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
