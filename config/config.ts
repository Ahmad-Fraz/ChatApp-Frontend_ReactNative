import { Platform } from "react-native";

export const API_URL =
  Platform.OS === "web"
    ? process.env.EXPO_PUBLIC_API_WEB
    : process.env.EXPO_PUBLIC_API_MOBILE;

export const SOCKET_URL =
  Platform.OS === "web"
    ? process.env.EXPO_PUBLIC_SOCKET_WEB
    : process.env.EXPO_PUBLIC_SOCKET_MOBILE;