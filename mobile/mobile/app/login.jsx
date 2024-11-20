import React, { useState } from "react";
import {
  StyleSheet,
  Platform,
  Text,
  View,
  Button,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

// AuthForms Component
const AuthForms = () => {
  const { signIn } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
 
    try {
      // In your AuthForms component:
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const userData = {
        email: formData.email,
        password: formData.password,
        ...(!isLogin && formData.name && { name: formData.name }),
      };

      // const response = await fetch(`http://192.168.100.3:5000${endpoint}`, {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Authentication failed");
      }

      const savedUser = await response.json();
      await signIn(savedUser);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Auth error:", error);
      setError(error.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={formData.name}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, name: text }))
          }
          autoCapitalize="words"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={formData.email}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, email: text }))
        }
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={formData.password}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, password: text }))
        }
        secureTextEntry
      />

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, confirmPassword: text }))
          }
          secureTextEntry
        />
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isLogin ? "Login" : "Register"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => {
          setIsLogin(!isLogin);
          setError(null);
          setFormData({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
          });
        }}
      >
        <Text style={styles.switchButtonText}>
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Main LoginScreen Component
export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      "816180050501-lp47c8kgbmb0tlteipan045cracnm4u6.apps.googleusercontent.com",
    iosClientId:
      "816180050501-764k6sgilf093gdgg80ph091es9s4im1.apps.googleusercontent.com",
    androidClientId:
      "816180050501-mc66d3hvlv15anjgs51o01ga31mg1pp5.apps.googleusercontent.com",
    webClientId:
      "816180050501-lp47c8kgbmb0tlteipan045cracnm4u6.apps.googleusercontent.com",
  });

  React.useEffect(() => {
    if (response?.type === "success") {
      setIsLoading(true);
      const { authentication } = response;
      fetchUserInfo(authentication.accessToken)
        .catch((error) => {
          console.error("Error in authentication flow:", error);
          setError("Authentication failed. Please try again.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (response?.type === "error") {
      setError("Google sign-in failed. Please try again.");
    }
  }, [response]);

  const fetchUserInfo = async (accessToken) => {
    if (!accessToken) {
      throw new Error("No access token available");
    }

    try {
      const googleResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!googleResponse.ok) {
        throw new Error(`Google API error: ${googleResponse.status}`);
      }

      const googleUser = await googleResponse.json();

      const userData = {
        googleId: googleUser.sub,
        name: googleUser.name,
        email: googleUser.email,
        profilePicture: googleUser.picture,
      };

      // const serverResponse = await fetch("http://192.168.100.3:5000/api/users", {
      const serverResponse = await fetch(
        "http://localhost:5000/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      if (!serverResponse.ok) {
        throw new Error(`Server error: ${serverResponse.status}`);
      }

      const savedUser = await serverResponse.json();
      await signIn(savedUser);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Detailed error in fetchUserInfo:", error);

      if (error.message.includes("Network request failed")) {
        throw new Error(
          "Network connection error. Please check your internet connection."
        );
      } else if (error.message.includes("Server error")) {
        throw new Error("Server error. Please try again later.");
      } else {
        throw new Error("Failed to complete sign in. Please try again.");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      console.error("Sign in prompt error:", error);
      setError("Failed to start sign in process");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <StatusBar style="auto" />

          <View style={styles.container}>
            <Text style={styles.title}>Code with Beto</Text>

            {/* Manual Authentication Forms */}
            <AuthForms />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In */}
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.buttonContainer}>
              <Button
                title={isLoading ? "Signing in..." : "Sign in with Google"}
                onPress={handleGoogleSignIn}
                color="#4285F4"
                disabled={!request || isLoading}
              />
            </View>

            {/* Debug Information */}
            {__DEV__ && (
              <Text style={styles.debugText}>
                Platform: {Platform.OS}
                {"\n"}
                Environment: {Constants.appOwnership || "unknown"}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 40,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  submitButton: {
    backgroundColor: "#4285F4",
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  submitButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  switchButton: {
    marginTop: 20,
  },
  switchButtonText: {
    color: "#4285F4",
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
    borderRadius: 5,
    overflow: "hidden",
  },
  errorText: {
    color: "red",
    marginBottom: 20,
    textAlign: "center",
  },
  debugText: {
    marginTop: 20,
    color: "#666",
    fontSize: 12,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
    maxWidth: 300,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
  },
});
