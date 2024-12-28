import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableWithoutFeedback,
  Platform,
  Clipboard,
  Keyboard,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import { PlusCircle } from "lucide-react-native";
import axios from "axios";

const DriverManagement = ({ parentId }) => {
  const [drivers, setDrivers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [keyboardOffset] = useState(new Animated.Value(0));

  useEffect(() => {
    loadDrivers();

    // Keyboard listeners
    const keyboardWillShow = (event) => {
      Animated.timing(keyboardOffset, {
        duration: event.duration,
        toValue: Platform.OS === "ios" ? event.endCoordinates.height : 0,
        useNativeDriver: false,
      }).start();
    };

    const keyboardWillHide = (event) => {
      Animated.timing(keyboardOffset, {
        duration: event.duration,
        toValue: 0,
        useNativeDriver: false,
      }).start();
    };

    const keyboardDidShow = (event) => {
      if (Platform.OS === "android") {
        Animated.timing(keyboardOffset, {
          duration: 100,
          toValue: event.endCoordinates.height,
          useNativeDriver: false,
        }).start();
      }
    };

    let keyboardWillShowListener,
      keyboardWillHideListener,
      keyboardDidShowListener,
      keyboardDidHideListener;

    if (Platform.OS === "ios") {
      keyboardWillShowListener = Keyboard.addListener(
        "keyboardWillShow",
        keyboardWillShow
      );
      keyboardWillHideListener = Keyboard.addListener(
        "keyboardWillHide",
        keyboardWillHide
      );
    } else {
      keyboardDidShowListener = Keyboard.addListener(
        "keyboardDidShow",
        keyboardDidShow
      );
      keyboardDidHideListener = Keyboard.addListener(
        "keyboardDidHide",
        keyboardWillHide
      );
    }

    // Cleanup
    return () => {
      if (Platform.OS === "ios") {
        keyboardWillShowListener?.remove();
        keyboardWillHideListener?.remove();
      } else {
        keyboardDidShowListener?.remove();
        keyboardDidHideListener?.remove();
      }
    };
  }, [parentId]);

  const loadDrivers = async () => {
    if (!parentId || parentId === "null" || parentId === "undefined") {
      console.log("Waiting for valid parent ID...");
      return;
    }

    try {
      console.log("Loading drivers for parent:", parentId);
      const response = await axios.get(
        `http://192.168.100.3:5000/api/drivers/parent/${parentId}`
      );

      if (response.data.success) {
        console.log("Successfully loaded drivers:", response.data.data);
        setDrivers(response.data.data);
      } else {
        console.log("Failed to load drivers:", response.data);
        setDrivers([]);
      }
    } catch (error) {
      console.error("Error loading drivers:", error);
      setDrivers([]);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(text);
        Alert.alert("Success", "Code copied to clipboard!");
      } else {
        await Clipboard.setString(text);
        Alert.alert("Success", "Code copied to clipboard!");
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      Alert.alert("Error", "Failed to copy code to clipboard");
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone) => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, "");
    // Check if it has 10-15 digits (accommodating international numbers)
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  };

  const validateFields = () => {
    if (!newDriver.name.trim()) {
      Alert.alert("Validation Error", "Please enter a driver name");
      return false;
    }

    if (!newDriver.phone) {
      Alert.alert("Validation Error", "Please enter a phone number");
      return false;
    }

    if (!isValidPhone(newDriver.phone)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid phone number (10-15 digits)"
      );
      return false;
    }

    if (!newDriver.email) {
      Alert.alert("Validation Error", "Please enter an email address");
      return false;
    }

    if (!isValidEmail(newDriver.email.trim())) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address (example@domain.com)"
      );
      return false;
    }

    return true;
  };

  const handleAddDriver = async () => {
    if (!validateFields()) {
      return;
    }

    try {
      // Clean up the phone number to only include digits
      const cleanPhone = newDriver.phone.replace(/\D/g, "");

      const response = await axios.post(
        "http://192.168.100.3:5000/api/drivers",
        {
          ...newDriver,
          phone: cleanPhone, // Use cleaned phone number
          email: newDriver.email.trim().toLowerCase(), // Normalize email
          name: newDriver.name.trim(), // Trim whitespace from name
          parentId,
        }
      );

      if (response.data.success) {
        const { driver, verificationCode } = response.data.data;
        setDrivers([...drivers, driver]);
        setShowAddModal(false);
        setNewDriver({ name: "", phone: "", email: "" });

        Alert.alert(
          "Driver Added Successfully",
          `Verification Code: ${verificationCode}\n\nPlease share this code with your driver for account activation.`,
          [
            {
              text: "Copy Code",
              onPress: () => copyToClipboard(verificationCode),
            },
            { text: "OK" },
          ]
        );
      }
    } catch (error) {
      console.error("Error adding driver:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to add driver"
      );
    }
  };

  const removeDriver = async (driverId) => {
    const driver = drivers.find((d) => d._id === driverId);

    Alert.alert(
      "Delete Driver",
      `Are you sure you want to delete ${driver.name}?\n\nWARNING: This action will permanently delete their account from the database and CANNOT be recovered.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await axios.delete(
                `http://192.168.100.3:5000/api/drivers/${driverId}`
              );
              if (response.data.success) {
                setDrivers(drivers.filter((driver) => driver._id !== driverId));
                Alert.alert(
                  "Success",
                  "Driver has been permanently deleted from the system."
                );
              }
            } catch (error) {
              console.error("Error deleting driver:", error);
              Alert.alert(
                "Error",
                "Failed to delete driver. Please try again later."
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const showDriverCode = async (driverId) => {
    try {
      const response = await axios.get(
        `http://192.168.100.3:5000/api/drivers/${driverId}/code`
      );

      if (response.data.success) {
        const verificationCode = response.data.verificationCode;
        Alert.alert(
          "Driver Activation Code",
          `Verification Code: ${verificationCode}\n\nShare this code with your driver to activate their account.`,
          [
            {
              text: "Copy Code",
              onPress: () => copyToClipboard(verificationCode),
            },
            { text: "OK" },
          ]
        );
      } else {
        Alert.alert(
          "Note",
          "This driver has already registered their account."
        );
      }
    } catch (error) {
      console.error("Error fetching driver code:", error);
      Alert.alert(
        "Error",
        "Could not retrieve the activation code. The driver may have already registered."
      );
    }
  };

  const renderDriverItem = (driver) => (
    <TouchableOpacity
      key={driver._id}
      style={styles.driverItem}
      onPress={() => showDriverCode(driver._id)}
    >
      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>{driver.name}</Text>
        <Text style={styles.driverEmail}>{driver.email}</Text>
        <Text style={styles.driverPhone}>{driver.phone}</Text>
        {!driver.isRegistered && (
          <Text style={styles.pendingText}>Pending Registration</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={(e) => {
          e.stopPropagation(); // Prevent triggering the parent TouchableOpacity
          removeDriver(driver._id);
        }}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Authorized Drivers</Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <PlusCircle size={20} color="#4CAF50" />
        <Text style={styles.addButtonText}>Add Driver</Text>
      </TouchableOpacity>

      <ScrollView style={styles.driversList}>
        {drivers.map(renderDriverItem)}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => {
          setShowAddModal(false);
          Keyboard.dismiss();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [
                    {
                      translateY: keyboardOffset.interpolate({
                        inputRange: [0, 300],
                        outputRange: [0, -10], // Changed from -100 to -50 to move up less
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
              ]}
            >
              <ScrollView>
                <Text style={styles.modalTitle}>Add New Driver</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Driver Name"
                  placeholderTextColor="#666"
                  value={newDriver.name}
                  onChangeText={(text) =>
                    setNewDriver({ ...newDriver, name: text })
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#666"
                  value={newDriver.phone}
                  onChangeText={(text) => {
                    // Only allow digits, spaces, and hyphens
                    const formatted = text.replace(/[^\d\s-]/g, "");
                    setNewDriver({ ...newDriver, phone: formatted });
                  }}
                  keyboardType="phone-pad"
                  maxLength={15}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={newDriver.email}
                  onChangeText={(text) =>
                    setNewDriver({ ...newDriver, email: text })
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleAddDriver}
                >
                  <Text style={styles.submitButtonText}>Add Driver</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddModal(false);
                    Keyboard.dismiss();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "500",
  },
  driversList: {
    maxHeight: 200,
  },
  pendingText: {
    color: "#FFA500",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  driverItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 10,
    // Add subtle feedback for touchable
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  driverEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 14,
    color: "#666",
  },
  removeButton: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginTop: "30%",
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "white",
    color: "#000",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default DriverManagement;
