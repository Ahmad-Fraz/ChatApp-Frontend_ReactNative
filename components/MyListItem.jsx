import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
dayjs.extend(relativeTime);

const MyListItem = React.memo(({ item, unreadCounts, currentUserId }) => {
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push({
      pathname: "/Chat",
      params: {
        userId: currentUserId,
        receiverId: item._id,
        receiverName: item.name,
      },
    });
  }, [router, currentUserId, item]);

  return (
    <TouchableOpacity onPress={handlePress} style={styles.userCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.name}</Text>

          {unreadCounts > 0 && (
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
  );
});

MyListItem.displayName = "MyListItem";

export default MyListItem;

const styles = StyleSheet.create({
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
