import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Configure default notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function checkNotificationPermissions() {
  if (Device.isDevice) {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      // If we don't have permission, request it
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === "granted";
      }

      return existingStatus === "granted";
    } catch (error) {
      console.error("Error checking notification permissions:", error);
      return false;
    }
  } else {
    console.log("Must use physical device for Push Notifications");
    return false;
  }
}

async function requestNotificationPermissionsAsync() {
  if (Platform.OS === "ios") {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return { status: finalStatus };
  }

  return { status: "granted" }; // Android permissions are granted by default
}

export async function saveNotification(notification) {
  try {
    const storedNotifications = await AsyncStorage.getItem("notifications");
    let notifications = JSON.parse(storedNotifications) || [];

    // Add timestamp if not present
    const notificationWithTimestamp = {
      ...notification,
      timestamp: notification.timestamp || new Date().toISOString(),
    };

    notifications.unshift(notificationWithTimestamp);

    // Optional: Limit the number of stored notifications (e.g., keep last 50)
    if (notifications.length > 50) {
      notifications = notifications.slice(0, 50);
    }

    await AsyncStorage.setItem("notifications", JSON.stringify(notifications));
  } catch (error) {
    console.error("Error saving notification:", error);
  }
}

export async function getNotifications() {
  try {
    const storedNotifications = await AsyncStorage.getItem("notifications");
    return JSON.parse(storedNotifications) || [];
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
}

// Optional: Helper function to register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    // Get the token that uniquely identifies this device
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

// Optional: Helper function to schedule a local notification
export async function scheduleLocalNotification(title, body, trigger = null) {
  try {
    const notificationContent = {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidImportance.MAX,
      color: "blue",
    };

    if (trigger) {
      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger,
      });
    } else {
      await Notifications.presentNotificationAsync(notificationContent);
    }
  } catch (error) {
    console.error("Error scheduling notification:", error);
  }
}
