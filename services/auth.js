import axios from "axios";
import { API_URL } from "../config/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import Toast from "react-native-toast-message";
// --- REGISTER FUNCTION ---

export const handleRegister = async (name, email, password) => {
  return await axios.post(`${API_URL}/api/auth/register`, {
    name: name,
    email: email,
    password: password,
  });
};

// --- LOGIN FUNCTION ---
export const handleLogin = async (email, password, login) => {
  try {
    // 1. Alias use karke post request
    const res = await axios.post(`${API_URL}/api/auth/login`, {
      email: email,
      password: password,
    });

    const { token, user } = res.data;

    if (res.data && res.data.token) {
      // 2. User info save karein (Optional)
      await login(token, user);
      console.log("Login user:", user);
      //console.log(`token: ${token} & user: ${JSON.stringify(user)}`);

      // 3. Navigation to UserList
      //router.replace({ pathname: "Users", params: { userId: user._id } });
      //Auto redirect in authContext-Login
    }
  } catch (error) {
    alert("Login Failed: " + (error.response?.data || "Server Error"));
  }
};

let onSessionExpired = null;
let sessionExpiryHandled = false; // to prevent duplicate Toasts and logout callbacks

export const resetSessionExpired = () => {
  sessionExpiryHandled = false;
};

export const handleSessionExpired = () => {
  console.log("Session expired. Please log in again.");
  // Prevent duplicate Toasts and logout callbacks.
  if (sessionExpiryHandled) return;

  sessionExpiryHandled = true;

  Toast.show({
    type: "error",
    text1: "Session Expired",
    text2: "Please log in again.",
    visibilityTime: 3500,
  });

  onSessionExpired?.();
};
export const setOnSessionExpired = (callback) => {
  onSessionExpired = callback;
};

let interceptorId = null;
let responseInterceptorId = null;
export const setupAxiosInterceptor = () => {
  if (interceptorId !== null) {
    // Interceptor already set up, no need to set it up again.
    return;
  }
  console.log("Interceptor REGISTERED");
  interceptorId = axios.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem("token");
      console.log("Token from Interceptor runned:", token);
      // Public requests, such as login/register, can proceed without a token.
      if (!token) {
        return config;
      }

      try {
        const decoded = jwtDecode(token);
        const isExpired = !decoded.exp || decoded.exp <= Date.now() / 1000;

        if (isExpired) {
          handleSessionExpired();

          return Promise.reject(
            new Error("Session expired. Please log in again."),
          );
        }

        // Attach the token to protected API requests.
        config.headers.Authorization = `Bearer ${token}`;

        return config;
      } catch (error) {
        // Do not swallow the expiry rejection from above.
        if (
          error instanceof Error &&
          error.message.startsWith("Session expired")
        ) {
          throw error;
        }

        await AsyncStorage.multiRemove(["token", "user"]);
        handleSessionExpired();

        return Promise.reject(new Error("Invalid token. Please log in again."));
      }
    },
    (error) => Promise.reject(error),
  );

  // Add response interceptor
  responseInterceptorId = axios.interceptors.response.use(
    (response) => response,

    (error) => {
      const status = error.response?.status;
      const url = error.config?.url || "";

      const isPublicRequest =
        url.includes("/api/auth/login") || url.includes("/api/auth/register");

      if (status === 401 && !isPublicRequest) {
        console.log("Server returned 401. Session expired.");

        handleSessionExpired();
      }

      return Promise.reject(error);
    },
  );
};
