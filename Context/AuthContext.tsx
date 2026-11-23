import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Toast from "react-native-toast-message";

import { setOnSessionExpired, resetSessionExpired } from "@/services/auth";

const AuthContext = createContext<any>(null);

type User = {
  _id: string;
  name: string;
  email: string;
};

export const AuthProvider = ({ children }: any) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const isTokenValid = (token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      console.log("Token is valid:", decoded);
      return decoded.exp > currentTime;
    } catch {
      console.log("Token is invalid");
      return false;
    }
  };

  // Check token validity on app start
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");

        if (token && isTokenValid(token) && storedUser) {
          setUser(JSON.parse(storedUser));
          setIsLoggedIn(true);
        } else {
          await AsyncStorage.multiRemove(["token", "user"]);
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        await AsyncStorage.multiRemove(["token", "user"]);
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  const login = async (token: string, user: User) => {
    console.log("Auth user: ", user);
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));

    setUser(user);
    resetSessionExpired(); // Reset the session expiry flag on login
    setIsLoggedIn(true);
    router.replace("/Users");
  };

  type logoutReason = "manual" | "sessionExpired";
  const logout = useCallback(async (reason: logoutReason = "manual") => {
    await AsyncStorage.multiRemove(["token", "user"]);

    setUser(null);

    setIsLoggedIn(false);
    router.replace("/Login");
    if (reason === "manual") {
      Toast.show({
        type: "info",
        text1: "Logged Out",
        text2: "You have been logged out successfully.",
        visibilityTime: 3500,
      });
    }
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => {
      void logout("sessionExpired");
    });

    return () => {
      setOnSessionExpired(null);
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, loading, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
