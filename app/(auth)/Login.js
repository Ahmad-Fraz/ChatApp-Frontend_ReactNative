import { router } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../Context/AuthContext";
import { handleLogin } from "../../services/auth";
const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = async () => {
    await handleLogin(email, password, login);
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.innerContainer}>
          <Text style={styles.logoText}>Welcome Back</Text>
          <Text style={styles.subText}>Login to stay connected</Text>

          <TextInput
            placeholder="Email Address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={onLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("Register")}>
            <Text style={styles.linkText}>
              Don&apos;t have an account? Register
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

// Styles remain similar for consistency
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  innerContainer: { flex: 1, justifyContent: "center", padding: 25 },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#075E54",
    textAlign: "center",
  },
  subText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#F6F6F6",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#25D366",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  linkText: {
    color: "#075E54",
    textAlign: "center",
    marginTop: 20,
    fontWeight: "600",
  },
});

export default Login;
