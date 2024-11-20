import React, { useEffect, useState, useCallback } from "react";
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
import { Collapsible } from "../../components/Collapsible";
import { ExternalLink } from "../../components/ExternalLink";
import ParallaxScrollView from "../../components/ParallaxScrollView";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
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

  const fetchNotifications = useCallback(async () => {
    try {
      // const response = await fetch(
      //   "http://192.168.100.3:5000/api/notifications"
      // );
      const response = await fetch(
        "http://localhost:5000/api/notifications"
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

      setNotifications(updatedData);
      setUnreadCount(updatedData.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error.message);
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
      <View style={styles.iconContainer}>{getIcon(item.icon)}</View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, item.read && styles.readText]}>
          {item.title}
        </Text>
        <Text style={[styles.time, item.read && styles.readText]}>
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
  notificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconContainer: {
    marginRight: 16,
  },
  icon: {
    width: 24,
    height: 24,
    color: "#000",
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: "#000",
  },
  time: {
    fontSize: 14,
    color: "#888",
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
});
