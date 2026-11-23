import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, useSegments, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { AuthProvider, useAuth } from "../Context/AuthContext";
import { NetworkProvider } from "../Context/NetworkProvider";
import { SocketProvider } from "../Context/SocketContext";
import { useEffect } from "react";
import { setupAxiosInterceptor } from "@/services/auth";
import { ImageViewerProvider } from "@/Context/ImageViewerContext";

export const unstable_settings = {
  anchor: "(tabs)",
};
export default function RootLayout() {
  setupAxiosInterceptor();

  return (
    <ImageViewerProvider>
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
    </ImageViewerProvider>
  );
}

function RootLayoutFunction() {
  const { isLoggedIn, loading } = useAuth();
  const segments = useSegments();
  console.log("Current Segments:", segments);

  useEffect(() => {
    if (loading) return; // Wait until loading is false
    if (!isLoggedIn && segments[0] !== "(auth)") {
      router.replace("/(auth)/Login");
    } else if (isLoggedIn && segments[0] === "(auth)") {
      router.replace("/(tabs)/Users");
    }
  }, [isLoggedIn, loading, segments]);

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
            headerShown: false,
            title: "Chat Message",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
