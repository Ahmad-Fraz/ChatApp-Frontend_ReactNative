import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { AuthProvider, useAuth } from "../Context/AuthContext";
import { NetworkProvider } from "../Context/NetworkProvider";
import { SocketProvider } from "../Context/SocketContext";
export const unstable_settings = {
  anchor: "(tabs)",
};
export default function RootLayout() {
  return (
    <NetworkProvider>
      <AuthProvider>
        <SocketProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <BottomSheetModalProvider>
                <RootLayoutFunction />
                <Toast />
              </BottomSheetModalProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SocketProvider>
      </AuthProvider>
    </NetworkProvider>
  );
}

function RootLayoutFunction() {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null; // splash / loader
  console.log(isLoggedIn);
  return (
    <>
      <Stack>
        {/* Auth Group: Iska naam sirf folder name hoga */}
        <Stack.Screen name="(auth)/Login" options={{ headerShown: false }} />

        {/* Tabs Group: Iska naam bhi sirf folder name hoga */}
        <Stack.Screen name="(tabs)/Users" options={{ headerShown: false }} />

        {/* Root Level Files: Agar Chat.tsx seedha app folder mein hai */}
        <Stack.Screen
          name="(tabs)/Chat"
          options={{
            headerShown: true,
            title: "Chat Message",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
