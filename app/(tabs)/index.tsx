import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        router.replace("/Users"); // logged in
      } else {
        router.replace("/Login"); // login
      }
    };

    checkAuth();
  }, []);

  return null;
}
