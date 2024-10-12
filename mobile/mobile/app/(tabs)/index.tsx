import { Image, StyleSheet, Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StatusBar } from "expo-status-bar";
import {  Text, View, Button } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from 'react';

export default function HomeScreen() {
  const [userInfo, setUserInfo] = React.useState(null);
  const [request, response, promptAsync] = Google.useAuthRequest({
    // androidClientId: "YOUR_ANDROID_CLIENT_ID",
    iosClientId:
      "816180050501-764k6sgilf093gdgg80ph091es9s4im1.apps.googleusercontent.com",
    webClientId:
      "816180050501-lp47c8kgbmb0tlteipan045cracnm4u6.apps.googleusercontent.com",
    scopes: ["profile", "email"],
  });

  React.useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      // Handle successful authentication here
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Text>Code with Beto</Text>
      <Button title="Sign in with Google" onPress={() => promptAsync()} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

