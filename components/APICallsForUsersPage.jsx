import { View, Text } from "react-native";
import axios from "axios";
import { API_URL } from "../config/config";
import { Platform } from "react-native";
import React from "react";

export const fetchUnread = async (userId, loading) => {
  if (loading || !userId) return;
  try {
    const res = await axios.get(`${API_URL}/api/messages/unread/${userId}`);

    return res.data;
  } catch (error) {
    console.error("Axios Error:", error);
    return [];
  }
};

export const playMessageSound = async (playerRef) => {
  try {
    if (Platform.OS === "web") {
      const soundFile = require("../assets/sounds/msgRecieveSound.mp3");
      const audio = new window.Audio(soundFile);

      await audio.play();
      return;
    }

    await playerRef.current?.play();
  } catch (err) {
    console.log("Sound Error:", err);
  }
};
