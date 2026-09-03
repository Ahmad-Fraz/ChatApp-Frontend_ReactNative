import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { createContext, useContext, useEffect, useState } from "react";

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

      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  };

  // 🔥 App start pe check
  useEffect(() => {
    const checkToken = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("token");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
        console.log("user from storage: ", JSON.parse(storedUser));
      }
      if (token && isTokenValid(token)) {
        setIsLoggedIn(true);
      } else {
        await AsyncStorage.removeItem("token");
        setIsLoggedIn(false);
      }
      setLoading(false);
    };

    checkToken();
  }, []);

  const login = async (token: string, user: User) => {
    console.log("Auth user: ", user);
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));

    setUser(user);
    console.log("user: ", user);
    setIsLoggedIn(true);
    router.replace("/Users");
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");

    setIsLoggedIn(false);
    setUser(null);

    setIsLoggedIn(false);
    router.replace("/Login");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, loading, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
