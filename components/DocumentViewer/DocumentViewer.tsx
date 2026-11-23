import { Message } from "@/types/message";
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from "react-native";

type DocumentFile = {
  name: string;
  uri: string;
  type: string;
  size: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  document: DocumentFile | null;
};

export default function DocumentViewer({ visible, onClose, document }: Props) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (document && visible)
      console.log("DocumentViewer: Loading document", document);

    return () => {
      setHtml("");
      setLoading(false);
      setError("");
    };
  }, [document, visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{document?.name}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          {loading && <ActivityIndicator size="large" color="#0000ff" />}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text>{html || "No content to display."}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 55,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  closeButton: {
    fontSize: 22,
    paddingLeft: 15,
  },
  errorText: {
    padding: 20,
    color: "red",
  },
  closeButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
});
