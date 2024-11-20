import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Button,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Text,
  View,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { ThemedView } from "../../components/ThemedView";
import { QrCode, PlusCircle, LogOut, User } from "lucide-react-native";
import Checkbox from "expo-checkbox";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";

export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [studentCode, setStudentCode] = useState("");
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [scannedPickupCode, setScannedPickupCode] = useState(null);
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const getUserId = () => {
    if (!user) return null;

    const userData = user.data || user;
    const possibleIdFields = ["_id", "id", "uid", "userId"];

    for (const field of possibleIdFields) {
      if (userData[field]) {
        return userData[field];
      }
    }

    if (userData.email) {
      return `email_${userData.email.replace(/[^a-zA-Z0-9]/g, "_")}`;
    }

    return null;
  };

  // Single initialization useEffect
  useEffect(() => {
    const initialize = async () => {
      if (!user) {
        console.log("No user available for initialization");
        return;
      }

      const userId = getUserId();
      if (!userId) {
        console.warn("Cannot initialize - no valid user ID");
        return;
      }

      // Initialize camera permission
      await requestCameraPermission();

      // Load students from database
      try {
        const storedStudents = await loadStoredStudents(userId);
        setLinkedStudents(storedStudents);
      } catch (error) {
        console.error("Error loading students:", error);
        Alert.alert("Error", "Failed to load student data");
      }

      setIsInitialized(true);
    };

    initialize();
  }, [user]);

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScanning(false);
    setScannedPickupCode(data);
    setShowPickupModal(true);
  };

  const showAlert = (title, message) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const verifyAndAddStudent = async () => {
    const userId = getUserId();
    if (!userId) {
      showAlert("Error", "Please ensure you are logged in to add students");
      return;
    }

    const trimmedCode = studentCode.trim().toUpperCase();
    if (!trimmedCode) {
      showAlert("Error", "Please enter a student code");
      return;
    }

    const isAlreadyLinked = linkedStudents.some(
      (student) => student.code === trimmedCode
    );

    if (isAlreadyLinked) {
      showAlert("Warning", "You have already linked this student.");
      return;
    }

    try {
      const verifyResponse = await axios.get(
        `http://localhost:5000/api/parent-student-links/verify/${trimmedCode}`
      );

      if (!verifyResponse.data.success) {
        showAlert("Warning", "The entered student code does not exist.");
        return;
      }

      // Create the link
      const createLinkResponse = await axios.post(
        "http://localhost:5000/api/parent-student-links",
        {
          parentId: userId,
          uniqueCode: trimmedCode,
        }
      );

      console.log("Create link response:", createLinkResponse.data); // Debug log

      if (createLinkResponse.data.success) {
        const newStudent = {
          code: createLinkResponse.data.data.code,
          name: createLinkResponse.data.data.name,
          linkId: createLinkResponse.data.data.linkId,
        };

        console.log("Adding new student:", newStudent); // Debug log

        setLinkedStudents((prev) => [...prev, newStudent]);
        setStudentCode("");
        setShowAddModal(false);
        Alert.alert("Success", "Student successfully linked to your account");
      }
    } catch (error) {
      console.error("Error linking student:", error);
      showAlert(
        "Error",
        error.response?.data?.message || "Failed to link student"
      );
    }
  };

  const loadStoredStudents = async (userId) => {
    try {
      // Updated to match the getParentLinks route
      const response = await axios.get(
        `http://localhost:5000/api/parent-student-links/${userId}`
      );
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error loading students:", error);
      return [];
    }
  };

  const removeStudent = async (linkId) => {
    try {
      // This path is correct as is
      const response = await axios.delete(
        `http://localhost:5000/api/parent-student-links/${linkId}`
      );

      if (response.data.success) {
        setLinkedStudents((prevStudents) =>
          prevStudents.filter((student) => student.linkId !== linkId)
        );
      }
    } catch (error) {
      console.error("Error removing student:", error);
      Alert.alert("Error", "Failed to remove student link");
    }
  };

  const handlePickupSubmit = async () => {
    if (selectedStudents.length === 0) {
      Alert.alert("Error", "Please select at least one student.");
      return;
    }

    try {
      // Get the user ID and info
      const userId = getUserId();
      if (!userId) {
        Alert.alert("Error", "User ID not found. Please try logging in again.");
        return;
      }

      // Get user info from the useAuth hook
      const userInfo = user.data || user;
      const parentName =
        userInfo.name || userInfo.displayName || "Unknown Parent";
      const parentEmail = userInfo.email || "N/A";

      // Get selected students' info
      const selectedStudentsInfo = linkedStudents
        .filter((student) => selectedStudents.includes(student.linkId))
        .map((student) => ({
          name: student.name,
          code: student.code,
          linkId: student.linkId,
        }));

      // Create the pickup request
      const pickupData = {
        pickupCode: scannedPickupCode,
        studentIds: selectedStudents, // Keep the original IDs for DB relations
        // Add these new fields to match our web UI needs
        studentInfo: selectedStudentsInfo,
        parent: {
          id: userId,
          name: parentName,
          email: parentEmail,
        },
      };

      console.log("Sending pickup data:", pickupData); // Debug log

      const response = await axios.post(
        "http://localhost:5000/api/pickup",
        pickupData
      );

      if (response.data.success) {
        Alert.alert("Success", response.data.message, [
          {
            text: "OK",
            onPress: () => {
              setShowPickupModal(false);
              setSelectedStudents([]);
              setScannedPickupCode(null);
            },
          },
        ]);
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error("Pickup submission error:", error.response?.data || error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to register pickup"
      );
    }
  };

  // And update the checkbox rendering:
  const renderCheckboxItem = (student, index) => {
    if (!student || !student.linkId) {
      console.log("Invalid student data:", student);
      return null;
    }

    return (
      <View
        key={`checkbox-${student.linkId}-${index}`}
        style={styles.checkboxItem}
      >
        <Checkbox
          value={selectedStudents.includes(student.linkId)}
          onValueChange={(checked) => {
            setSelectedStudents((prev) => {
              // Create a new array to modify
              const updatedSelection = [...prev];

              if (checked) {
                // Only add if not already included
                if (!updatedSelection.includes(student.linkId)) {
                  updatedSelection.push(student.linkId);
                }
              } else {
                // Remove this student's ID if unchecked
                const index = updatedSelection.indexOf(student.linkId);
                if (index > -1) {
                  updatedSelection.splice(index, 1);
                }
              }

              return updatedSelection;
            });
          }}
          style={styles.checkbox}
        />
        <Text style={styles.checkboxLabel}>{student.name}</Text>
      </View>
    );
  };

  const executeLogout = async () => {
    try {
      setShowDropdown(false);
      setIsLoggingOut(true);

      await signOut();

      if (Platform.OS === "web") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to logout?")) {
        executeLogout();
      }
    } else {
      Alert.alert("Logout", "Are you sure you want to logout?", [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => console.log("Logout cancelled"),
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: executeLogout,
        },
      ]);
    }
  };

  const handleGlobalPress = () => {
    if (showDropdown) {
      setShowDropdown(false);
    }
  };

  const renderStudentItem = (student, index) => {
    console.log("Rendering student:", student); // Debug log
    return (
      <View
        key={`student-${student.linkId}-${index}`}
        style={styles.studentItem}
      >
        <Text style={styles.studentName}>
          {student.name || "No name available"}
          {__DEV__ && ` (${student.code})`} {/* Show code in development */}
        </Text>
        <TouchableOpacity
          onPress={() => removeStudent(student.linkId)}
          style={styles.removeButton}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const ProfileDropdown = () => {
    const getUserInfo = () => {
      if (!user) return { name: "User", email: "" };

      // Handle both Google auth and manual login data structures
      const userData = user.data || user;

      return {
        name: userData.name || userData.displayName || "User",
        email: userData.email || "",
        profilePicture: userData.profilePicture || userData.picture || null,
      };
    };

    if (!showDropdown) return null;

    const userInfo = getUserInfo();

    return (
      <View style={styles.dropdownMenu}>
        <View style={styles.dropdownHeader}>
          {userInfo.profilePicture ? (
            <Image
              source={{ uri: userInfo.profilePicture }}
              style={styles.dropdownProfileImage}
            />
          ) : (
            <View style={styles.profileImageFallback}>
              <User size={24} color="#666" />
            </View>
          )}
          <View style={styles.dropdownUserInfo}>
            <Text style={styles.dropdownName}>{userInfo.name}</Text>
            <Text style={styles.dropdownEmail}>{userInfo.email}</Text>
          </View>
        </View>
        <View style={styles.dropdownDivider} />
        <TouchableOpacity
          style={styles.dropdownItem}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#FF0000" />
          ) : (
            <>
              <LogOut size={20} color="#FF0000" />
              <Text style={styles.dropdownText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <ThemedView style={styles.container}>
      <TouchableWithoutFeedback onPress={handleGlobalPress}>
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Code with Beto</Text>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
            >
              {user?.profilePicture ? (
                <Image
                  source={{ uri: user.profilePicture }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImageFallback}>
                  <User size={24} color="#666" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <ProfileDropdown />

          <ScrollView style={styles.studentsList}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Linked Students</Text>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <PlusCircle size={20} color="#4CAF50" />
              <Text style={styles.addButtonText}>Add Student</Text>
            </TouchableOpacity>

            {linkedStudents.map((student, index) =>
              renderStudentItem(student, index)
            )}
          </ScrollView>

          <Button
            title={scanning ? "Cancel Scan" : "Scan QR Code"}
            onPress={() => setScanning(!scanning)}
            disabled={linkedStudents.length === 0}
          />

          {scanning && (
            <ThemedView style={styles.cameraContainer}>
              <BarCodeScanner
                onBarCodeScanned={handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
              />
            </ThemedView>
          )}

          <Modal
            animationType="fade"
            transparent={true}
            visible={showAddModal}
            onRequestClose={() => setShowAddModal(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowAddModal(false)}>
              <ThemedView style={styles.centeredView}>
                <TouchableWithoutFeedback>
                  <ThemedView style={styles.modalView}>
                    <Text style={styles.modalText}>
                      Enter Student Unique Code
                    </Text>
                    <TextInput
                      style={styles.input}
                      onChangeText={setStudentCode}
                      value={studentCode}
                      placeholder="Enter code here"
                      placeholderTextColor="#888"
                      keyboardType="default"
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={verifyAndAddStudent}
                    >
                      <Text style={styles.submitButtonText}>Add Student</Text>
                    </TouchableOpacity>
                  </ThemedView>
                </TouchableWithoutFeedback>
              </ThemedView>
            </TouchableWithoutFeedback>
          </Modal>

          <Modal
            animationType="fade"
            transparent={true}
            visible={showPickupModal}
            onRequestClose={() => {
              setShowPickupModal(false);
              setSelectedStudents([]);
            }}
          >
            <TouchableWithoutFeedback onPress={() => setShowPickupModal(false)}>
              <ThemedView style={styles.centeredView}>
                <TouchableWithoutFeedback>
                  <ThemedView style={styles.modalView}>
                    <Text style={styles.modalText}>
                      Select Students for Pickup
                    </Text>
                    <ScrollView style={styles.checkboxContainer}>
                      {linkedStudents.map((student, index) =>
                        renderCheckboxItem(student, index)
                      )}
                    </ScrollView>
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handlePickupSubmit}
                    >
                      <Text style={styles.submitButtonText}>
                        Confirm Pickup
                      </Text>
                    </TouchableOpacity>
                  </ThemedView>
                </TouchableWithoutFeedback>
              </ThemedView>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  studentsList: {
    flex: 1,
    marginBottom: 20,
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
    backgroundColor: "#e8f5e9", // Light green background
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

  contentContainer: {
    flex: 1,
  },

  studentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  studentsList: {
    flex: 1,
    marginBottom: 20,
  },
  studentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    marginBottom: 10,
  },
  studentName: {
    fontSize: 16,
  },
  removeButton: {
    padding: 8,
    backgroundColor: "#ff4444",
    borderRadius: 5,
  },
  removeButtonText: {
    color: "white",
    fontSize: 14,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    backgroundColor: "#e8e8e8",
    borderRadius: 10,
    marginBottom: 20,
  },
  addButtonText: {
    marginLeft: 10,
    fontSize: 16,
  },
  cameraContainer: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    marginTop: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
    backgroundColor: "#fff",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  input: {
    height: 40,
    width: "100%",
    marginVertical: 12,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    borderColor: "#ddd",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 10,
    paddingHorizontal: 20,
    width: "100%",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  checkboxContainer: {
    width: "100%",
    maxHeight: 200,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 5,
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileButton: {
    position: "relative",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  profileImageFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8e8e8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  dropdownMenu: {
    position: "absolute",
    top: 70,
    right: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownVisible: {
    display: "flex",
  },
  dropdownHidden: {
    display: "none",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 5,
  },
  dropdownText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#FF0000",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  dropdownProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  dropdownUserInfo: {
    marginLeft: 10,
    flex: 1,
  },
  dropdownName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  dropdownEmail: {
    fontSize: 14,
    color: "#666",
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownMenu: {
    position: "absolute",
    top: 70,
    right: 20,
    backgroundColor: "white",
    borderRadius: 12,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownVisible: {
    display: "flex",
  },
  dropdownHidden: {
    display: "none",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  dropdownText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#FF0000",
    fontWeight: "500",
  },
});
