import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { handleRegister } from "../../services/auth";

const Register = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    // Basic Validation
    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true); // Button dabate hi loading shuru
    try {
      const res = await handleRegister(name, email, password);

      // Agar register successful ho jaye (status 200 ya 201)
      if (res.status === 201 || res.status === 200) {
        alert("Registration Successful!");
        router.replace("Login");
      }
    } catch (error) {
      // Agar koi masla aaye (e.g. Email already exists)
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false); // Kaam khatam hone par loading band
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.logoText}>WhatsApp Clone</Text>
        <Text style={styles.subText}>
          Create a new account to start chatting
        </Text>

        <TextInput
          placeholder="Full Name"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          placeholder="Email Address"
          style={styles.input}
          keyboardType="email-address"
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

        <TouchableOpacity
          style={[styles.button, loading && { backgroundColor: "#ccc" }]}
          onPress={onRegister}
        >
          <Text style={styles.buttonText}>
            {loading ? "Processing..." : "Register"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("Login")}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

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

export default Register;
