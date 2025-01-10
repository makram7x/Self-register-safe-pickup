import React, { useEffect, useState, useCallback, useRef } from "react";
import io from "socket.io-client";
import { AppState } from "react-native";
import {
  StyleSheet,
  FlatList,
  View,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Text,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Collapsible } from "../../components/Collapsible";
// import { ExternalLink } from "../../components/ExternalLink";
// import ParallaxScrollView from "../../components/ParallaxScrollView";
// import { ThemedText } from "../../components/ThemedText";
// import { ThemedView } from "../../components/ThemedView";
import {
  MegaphoneIcon,
  CalendarCheckIcon,
  CircleAlertIcon,
} from "../../assets/icons/icons";

export default function NotificationsScreen() {
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigation = useNavigation();
  const socketRef = useRef(null);
  const appState = useRef(AppState.currentState);

  // Initialize Socket.IO connection
  useEffect(() => {
    // Create Socket.IO connection
    socketRef.current = io("http://192.168.100.3:5000", {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Handle socket connection events
    socketRef.current.on("connect", () => {
      console.log("Socket connected");
      fetchNotifications(); // Refresh notifications on reconnection
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Handle new notifications with proper state updates
    socketRef.current.on("newNotification", (notification) => {
      console.log("New notification received:", notification);
      setNotifications((prevNotifications) => {
        // Check if notification already exists
        const exists = prevNotifications.some(
          (n) => n._id === notification._id
        );
        if (!exists) {
          // Add unread flag
          const newNotification = { ...notification, read: false };
          return [newNotification, ...prevNotifications];
        }
        return prevNotifications;
      });

      setUnreadCount((prev) => prev + 1);
    });

    // Handle app state changes
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App came to foreground - reconnecting socket");
        if (socketRef.current && !socketRef.current.connected) {
          socketRef.current.connect();
          fetchNotifications();
        }
      }
      appState.current = nextAppState;
    });

    // Clean up function
    return () => {
      console.log("Cleaning up socket connection");
      subscription.remove();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off("newNotification");
        socketRef.current.off("connect");
        socketRef.current.off("connect_error");
      }
    };
  }, []); // Empty dependency array since we want this to run once

  // Update fetchNotifications to handle errors better
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(
        "http://192.168.100.3:5000/api/notifications"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const readNotifications = await AsyncStorage.getItem("readNotifications");
      const readSet = new Set(JSON.parse(readNotifications) || []);

      const updatedData = data.map((notification) => ({
        ...notification,
        read: readSet.has(notification._id),
      }));

      console.log("Fetched notifications:", updatedData);
      setNotifications(updatedData);
      setUnreadCount(updatedData.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    navigation.setOptions({
      tabBarBadge: unreadCount > 0 ? unreadCount : null,
    });
  }, [fetchNotifications, navigation, unreadCount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const readNotifications = await AsyncStorage.getItem("readNotifications");
      const readSet = new Set(JSON.parse(readNotifications) || []);
      readSet.add(notificationId);
      await AsyncStorage.setItem(
        "readNotifications",
        JSON.stringify([...readSet])
      );

      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => prev - 1);

      // Emit to server that notification was read
      if (socketRef.current) {
        socketRef.current.emit("markAsRead", notificationId);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  function getIcon(icon) {
    switch (icon) {
      case "calendar":
        return <CalendarCheckIcon style={styles.icon} />;
      case "alert":
        return <CircleAlertIcon style={styles.icon} />;
      case "bell":
        return <MegaphoneIcon style={styles.icon} />;
      default:
        return <MegaphoneIcon style={styles.icon} />;
    }
  }

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationContainer,
        item.read && styles.readNotification,
      ]}
      onPress={() => {
        setSelectedNotification(item);
        setModalVisible(true);
        if (!item.read) {
          markAsRead(item._id);
        }
      }}
    >
      <View style={styles.iconContainer}>
        {React.cloneElement(getIcon(item.icon), {
          style: [styles.icon, item.read && styles.readIcon],
        })}
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, item.read && styles.readText]}>
          {item.title}
        </Text>
        <Text style={[styles.time, item.read && styles.readTime]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // Difference in seconds

    if (diff < 60) {
      return `${diff}s ago`;
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes}m ago`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diff / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Notifications</Text>
        </View>
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.listContentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {selectedNotification?.title}
              </Text>
              <Text style={styles.modalDescription}>
                {selectedNotification?.description}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
  },
  listContentContainer: {
    paddingTop: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 20,
    color: "#000",
  },
  modalCloseButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: "flex-end",
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  notificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff", // Default background color
  },

  readNotification: {
    backgroundColor: "#f5f5f5", // Light gray background for read notifications
    opacity: 0.8, // Slightly reduce opacity
  },

  title: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },

  readText: {
    color: "#666", // Darker gray for read notification text
    fontWeight: "400", // Slightly lighter font weight
  },

  time: {
    fontSize: 14,
    color: "#888",
  },

  readTime: {
    color: "#999", // Lighter gray for read notification time
  },

  icon: {
    width: 24,
    height: 24,
    color: "#000",
  },

  readIcon: {
    color: "#666", // Grayed out icon for read notifications
    opacity: 0.8,
  },
});
