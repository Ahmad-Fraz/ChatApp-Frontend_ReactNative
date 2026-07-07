import NetInfo from "@react-native-community/netinfo";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native"; // Platform import karna lazmi hai

const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const checkRealStatus = async () => {
      // Sirf Web par fetch check karein taake bandwidth bachay
      if (Platform.OS !== "web") return;

      try {
        await fetch("https://www.google.com/favicon.ico", {
          mode: "no-cors",
          cache: "no-store",
        });
        setIsConnected(true);
      } catch (error) {
        setIsConnected(false);
      }
    };

    // Pehli baar check karein
    checkRealStatus();

    // --- Interval Logic (Sirf Web ke liye) ---
    let interval;
    if (Platform.OS === "web") {
      interval = setInterval(checkRealStatus, 10000);
    }

    // --- NetInfo Listener (Dono ke liye, lekin mobile par ye kaafi hai) ---
    const unSubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected === false) {
        setIsConnected(false);
      } else {
        // Mobile par state change hote hi library sahi batati hai
        // Web par hum dubara fetch kar ke confirm karte hain
        if (Platform.OS === "web") {
          checkRealStatus();
        } else {
          setIsConnected(true);
        }
      }
    });

    return () => {
      unSubscribe();
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
