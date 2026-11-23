import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleSessionExpired } from "./../services/auth";

const isTokenValid = (token: string) => {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

const verifyToken = async (): Promise<string | false> => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (token && isTokenValid(token)) {
      return token;
    } else {
      await AsyncStorage.multiRemove(["token", "user"]);
      handleSessionExpired();
      return false;
    }
  } catch (error) {
    await AsyncStorage.multiRemove(["token", "user"]);
    return false;
  }
};

export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = await verifyToken();

  if (!token) {
    return Promise.reject(new Error("Session expired. Please log in again."));
  }
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, { ...options, headers });
};
