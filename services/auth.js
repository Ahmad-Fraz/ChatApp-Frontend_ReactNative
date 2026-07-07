import axios from "axios";
import { API_URL } from "../config/config";

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
