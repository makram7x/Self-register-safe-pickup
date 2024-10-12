import React from "react";
import { Image, StyleSheet, Platform, Text, View, Button } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Google from "expo-auth-session/providers/google";
import axios from "axios";

export default function LoginScreen() {
  const [userInfo, setUserInfo] = React.useState(null);
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      "816180050501-764k6sgilf093gdgg80ph091es9s4im1.apps.googleusercontent.com",
    webClientId:
      "816180050501-lp47c8kgbmb0tlteipan045cracnm4u6.apps.googleusercontent.com",
    scopes: ["profile", "email"],
  });

  React.useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      fetchUserInfo(authentication.accessToken);
    }
  }, [response]);

  const fetchUserInfo = async (accessToken) => {
    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const user = await response.json();
      setUserInfo(user);

      // Save user to MongoDB if it's their first sign-in
      await saveUserToDatabase(user);
    } catch (error) {
      // Handle error
      console.error("Failed to fetch user info:", error);
    }
  };

  const saveUserToDatabase = async (user) => {
    try {
      const response = await axios.post(
        "https://your-mongodb-api-url/users",
        user
      );
      console.log("User saved to database:", response.data);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log("User already exists in the database");
      } else {
        console.error("Failed to save user to database:", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {/* <Image source={require("./assets/logo.png")} style={styles.logo} /> */}
      <Text style={styles.title}>Code with Beto</Text>
      {userInfo ? (
        <View>
          <Text>Welcome, {userInfo.name}!</Text>
          <Text>Email: {userInfo.email}</Text>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <Button
            title="Sign in with Google"
            onPress={() => promptAsync()}
            color="#4285F4"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 40,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
    borderRadius: 5,
    overflow: "hidden",
  },
});
