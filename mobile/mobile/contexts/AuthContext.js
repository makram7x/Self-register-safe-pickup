// contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { router } from "expo-router";

const AuthContext = createContext({});

// Storage helper specifically for web
const webStorage = {
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Error setting localStorage:", e);
    }
  },
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error("Error getting localStorage:", e);
      return null;
    }
  },
  clear: () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error("Error clearing localStorage:", e);
    }
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider mounted");
    loadUser();
  }, []);

  const loadUser = async () => {
    console.log("Starting loadUser...");
    try {
      let userData;
      if (Platform.OS === "web") {
        userData = webStorage.getItem("user");
      } else {
        const userStr = await AsyncStorage.getItem("user");
        userData = userStr ? JSON.parse(userStr) : null;
      }

      console.log("Loaded user data:", userData);
      if (userData) {
        setUser(userData);
        console.log("User state set:", userData);
      }
    } catch (error) {
      console.error("Error in loadUser:", error);
    } finally {
      setIsLoading(false);
      console.log("loadUser completed");
    }
  };

  const signIn = async (userData) => {
    console.log("Starting signIn:", userData);
    try {
      if (Platform.OS === "web") {
        webStorage.setItem("user", userData);
      } else {
        await AsyncStorage.setItem("user", JSON.stringify(userData));
      }
      setUser(userData);
      console.log("SignIn completed");
    } catch (error) {
      console.error("Error in signIn:", error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log("Starting signOut process");
    try {
      // Clear storage based on platform
      if (Platform.OS === "web") {
        console.log("Clearing web storage");
        webStorage.clear();
      } else {
        console.log("Clearing AsyncStorage");
        await AsyncStorage.clear();
      }

      // Clear state
      console.log("Clearing user state");
      setUser(null);

      // For web, force a complete reload
      if (Platform.OS === "web") {
        console.log("Forcing page reload");
        window.location.href = "/";
        return; // Stop execution here for web
      }

      // For mobile, use router
      console.log("Navigating to login");
      router.replace("/");
    } catch (error) {
      console.error("Error in signOut:", error);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
