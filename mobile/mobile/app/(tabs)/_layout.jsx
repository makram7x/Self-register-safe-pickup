import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TabBarIcon } from "../../components/navigation/TabBarIcon";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useAuth } from "../../contexts/AuthContext";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const isDriver = Boolean(user?.isDriver);

  useEffect(() => {
    const fetchAndUpdateNotifications = async () => {
      try {
        // Fetch notifications from server
        const response = await fetch(
          "http://192.168.100.3:5000/api/notifications"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const notifications = await response.json();

        // Store notifications in AsyncStorage
        await AsyncStorage.setItem(
          "notifications",
          JSON.stringify(notifications)
        );

        // Get read notifications from AsyncStorage
        const readNotifications = await AsyncStorage.getItem(
          "readNotifications"
        );
        const readSet = new Set(JSON.parse(readNotifications) || []);

        // Calculate unread count
        const unreadCount = notifications.filter(
          (n) => !readSet.has(n._id)
        ).length;
        setUnreadCount(unreadCount);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    // Fetch immediately on mount
    fetchAndUpdateNotifications();

    // Set up interval for periodic updates
    const interval = setInterval(fetchAndUpdateNotifications, 60000);
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
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "notifications" : "notifications-outline"}
              color={color}
            />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : null,
        }}
      />
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
        name="driver"
        options={{
          title: "Driver",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "car" : "car-outline"} color={color} />
          ),
          href: isDriver ? null : "/driver",
          tabBarStyle: isDriver ? { display: "none" } : undefined,
        }}
      />
    </Tabs>
  );
}
