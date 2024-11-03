import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { checkNotificationPermissions } from "../components/notificationService";
import { useColorScheme } from "../hooks/useColorScheme";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Navigation wrapper component to handle auth state
function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Check if the user is authenticated
      const inAuthGroup = segments[0] === "login";

      if (!user) {
        // Redirect to login if there's no user
        router.replace("/login");
      } else if (user && inAuthGroup) {
        // Redirect to home if user is authenticated and trying to access login
        router.replace("/(tabs)");
      }
    }
  }, [user, segments, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          // Prevent going back
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          // Prevent going back to login
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    async function prepare() {
      try {
        if (loaded) {
          await SplashScreen.hideAsync();
        }

        const hasPermission = await checkNotificationPermissions();
        if (hasPermission) {
          console.log("Notification permissions granted");
        } else {
          console.log("Notification permissions not granted");
        }
      } catch (error) {
        console.warn("Error during app preparation:", error);
      }
    }

    prepare();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  );
}
