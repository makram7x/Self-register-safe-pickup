import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { TabBarIcon } from "../../components/navigation/TabBarIcon";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";
// import { checkUnreadNotifications } from "../../components/notificationService";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkUnreadNotifications = async () => {
      try {
        const notifications = await AsyncStorage.getItem("notifications");
        const readNotifications = await AsyncStorage.getItem(
          "readNotifications"
        );
        const allNotifications = JSON.parse(notifications) || [];
        const readSet = new Set(JSON.parse(readNotifications) || []);
        const unreadCount = allNotifications.filter(
          (n) => !readSet.has(n._id)
        ).length;
        setUnreadCount(unreadCount);
      } catch (error) {
        console.error("Error checking unread notifications:", error);
      }
    };

    checkUnreadNotifications();
    const interval = setInterval(checkUnreadNotifications, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "code-slash" : "code-slash-outline"}
              color={color}
            />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : null,
        }}
      />
    </Tabs>
  );
}
