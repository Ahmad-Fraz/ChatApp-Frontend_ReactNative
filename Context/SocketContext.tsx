import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../Context/AuthContext";
import { SOCKET_URL } from "../config/config";

interface User {
  _id: string;
  name?: string;
  email?: string;
}

interface SocketContextType {
  socket: Socket | null;
  user: User | null;
  currentChatUserId: null | string;
  setCurrentChatUserId: React.Dispatch<React.SetStateAction<null | string>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used inside SocketProvider");
  }

  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const { user } = useAuth(); // AuthContext se user
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentChatUserId, setCurrentChatUserId] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Socket Connected:", newSocket.id);
      newSocket.emit("join", user._id);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket Disconnected");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        user,
        currentChatUserId,
        setCurrentChatUserId,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
