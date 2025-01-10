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
import { ThemedView } from "../../components/ThemedView";
import Checkbox from "expo-checkbox";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { QrCode, PlusCircle, LogOut, User } from "lucide-react-native";
import QRScanner from "../../components/QRscanner";
import PickupConfirmationModal from "../../components/PickupConfirmationModal";
import io from "socket.io-client";

export default function HomeScreen() {
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
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isSubmittingPickup, setIsSubmittingPickup] = useState(false);
  const [pendingPickupId, setPendingPickupId] = useState(null);
  const [activePickup, setActivePickup] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState(null);
  const [isAlertShowing, setIsAlertShowing] = useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [socket, setSocket] = useState(null);
  const [localActionInProgress, setLocalActionInProgress] = useState(false);
  const getParentId = () => {
    const userId = getUserId();
    return userId;
  };

  useEffect(() => {
    if (user) {
      const newSocket = io("http://192.168.100.3:5000", {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [user]);

  useEffect(() => {
    if (socket && pendingPickupId) {
      socket.emit("join-pickup", pendingPickupId);

      socket.on("pickup-status-updated", ({ pickupId, status, pickup }) => {
        if (
          pickupId === pendingPickupId &&
          (status === "completed" || status === "cancelled")
        ) {
          if (!localActionInProgress) {
            const message =
              status === "completed"
                ? "Pickup has been completed successfully"
                : "Pickup has been cancelled";

            Alert.alert("Status Update", message, [
              {
                text: "OK",
                onPress: () => resetPickupStates(),
              },
            ]);
          }
          resetPickupStates();
        }
      });

      return () => {
        socket.off("pickup-status-updated");
        socket.emit("leave-pickup", pendingPickupId);
      };
    }
  }, [socket, pendingPickupId, localActionInProgress]);

  const resetPickupStates = () => {
    setActivePickup(null);
    setSelectedStudents([]);
    setScannedPickupCode(null);
    setPendingPickupId(null);
    setShowConfirmationModal(false);
    setLocalActionInProgress(false);
  };

  const handlePickupSubmit = async () => {
    console.log("Current user object:", JSON.stringify(user, null, 2));
    if (selectedStudents.length === 0) {
      Alert.alert("Error", "Please select at least one student.");
      return;
    }

    try {
      const userData = user.data || user;
      const isDriverUser = userData.isDriver || userData.driver;

      let pickupData = {
        pickupCode: scannedPickupCode,
        studentIds: selectedStudents,
        studentInfo: linkedStudents
          .filter((student) => selectedStudents.includes(student.linkId))
          .map((student) => ({
            name: student.name,
            code: student.code,
            linkId: student.linkId,
          })),
      };

      if (isDriverUser) {
        pickupData = {
          ...pickupData,
          driverId: userData.driver.id || userData.id,
        };
      } else {
        pickupData = {
          ...pickupData,
          parent: {
            id: userData.id,
            name: userData.name || userData.displayName,
            email: userData.email,
          },
        };
      }

      const response = await axios.post(
        "http://192.168.100.3:5000/api/pickup",
        pickupData
      );

      if (response.data.success) {
        setActivePickup(response.data.data.pickup);
        setPendingPickupId(response.data.data.pickup._id);
        setShowPickupModal(false);

        Alert.alert(
          "Request Sent",
          "Your pickup request has been sent successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                setShowConfirmationModal(true);
              },
            },
          ]
        );
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

  const submitPickupRequest = async () => {
    if (!pendingPickupId) {
      Alert.alert("Error", "No pending pickup found");
      return;
    }

    setIsSubmittingPickup(true);
    setLocalActionInProgress(true);

    try {
      const userData = user.data || user;
      const userType = userData.driver ? "driver" : "parent";
      const userName = userData.name || userData.displayName;
      const userId = userData.id || userData.driver?.id;

      const response = await axios.put(
        `http://192.168.100.3:5000/api/pickup/${pendingPickupId}/status`,
        {
          status: "completed",
          updatedBy: {
            id: userId,
            name: userName,
            type: userType,
            email: userData.email,
          },
          notes: `Pickup completed by ${userType}`,
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Pickup completed successfully", [
          {
            text: "OK",
            onPress: resetPickupStates,
          },
        ]);
      } else {
        throw new Error(response.data.message || "Failed to complete pickup");
      }
    } catch (error) {
      console.error("Pickup completion error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to complete pickup"
      );
      setLocalActionInProgress(false);
    } finally {
      setIsSubmittingPickup(false);
    }
  };

  const handleCancelPickup = async () => {
    setLocalActionInProgress(true);

    try {
      const userData = user.data || user;
      const userType = userData.driver ? "driver" : "parent";
      const userName = userData.name || userData.displayName;
      const userId = userData.id || userData.driver?.id;

      const response = await axios.put(
        `http://192.168.100.3:5000/api/pickup/${pendingPickupId}/status`,
        {
          status: "cancelled",
          updatedBy: {
            id: userId,
            name: userName,
            type: userType,
            email: userData.email,
          },
          notes: `Pickup cancelled by ${userType}`,
        }
      );

      if (response.data.success) {
        Alert.alert("Cancelled", "Pickup request has been cancelled", [
          {
            text: "OK",
            onPress: resetPickupStates,
          },
        ]);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Pickup cancellation error:", error);
      Alert.alert("Error", "Failed to cancel pickup");
      setLocalActionInProgress(false);
    }
  };

  // Add new function to handle track pickup button press
  const handleTrackPickup = () => {
    if (activePickup) {
      setShowConfirmationModal(true);
    }
  };

  const verifyQRCode = async (code) => {
    try {
      const userId = getUserId();
      if (!userId) {
        showErrorAlert(
          "Error",
          "User ID not found. Please try logging in again."
        );
        return { success: false };
      }

      const response = await axios.post(
        "http://192.168.100.3:5000/api/qr-codes/verify",
        {
          code: code,
          parentId: userId,
          studentId: linkedStudents[0]?.linkId,
        }
      );

      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      console.error("QR verification error:", error);

      // Immediately stop scanning on error
      setScanning(false);

      const errorMessage =
        error.response?.data?.message || "Failed to verify QR code";
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (isVerifying || isAlertShowing) {
      return;
    }
    setScanning(false);
    setIsVerifying(true);
    console.log("QR code scanned:", type, data);

    if (type === "qr" || type === "org.iso.QRCode") {
      try {
        const verificationResult = await verifyQRCode(data);
        if (verificationResult.success) {
          setScannedPickupCode(data);
          setShowPickupModal(true);
        } else {
          setIsAlertShowing(true);
          const errorMessage = verificationResult.message || "Invalid QR code";
          Alert.alert(
            "Invalid QR Code",
            errorMessage,
            [
              {
                text: "Close",
                onPress: () => {
                  setIsAlertShowing(false);
                  setIsVerifying(false);
                },
              },
            ],
            { cancelable: false }
          );
        }
      } catch (error) {
        console.error("Error during QR verification:", error);
        setIsAlertShowing(true);
        const alertConfig = {
          expired: {
            title: "Expired QR Code",
            message: "This QR code has expired. Please request a new one.",
          },
          inactive: {
            title: "Inactive QR Code",
            message:
              "This QR code is no longer active. Please request a new one.",
          },
          default: {
            title: "Error",
            message: "Failed to verify QR code. Please try again.",
          },
        };
        const errorType = error.response?.data?.qrStatus || "default";
        const { title, message } = alertConfig[errorType];
        Alert.alert(
          title,
          message,
          [
            {
              text: "Close",
              onPress: () => {
                setIsAlertShowing(false);
                setIsVerifying(false);
              },
            },
          ],
          { cancelable: false }
        );
      }
    } else {
      setIsAlertShowing(true);
      Alert.alert(
        "Invalid Code",
        "Please scan a valid QR code.",
        [
          {
            text: "Close",
            onPress: () => {
              setIsAlertShowing(false);
              setIsVerifying(false);
            },
          },
        ],
        { cancelable: false }
      );
    }
  };

  // Update the renderActionButton function
  const renderActionButton = () => {
    if (linkedStudents.length === 0) {
      return null;
    }

    if (activePickup) {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.trackButton]}
          onPress={handleTrackPickup}
        >
          <Text style={styles.actionButtonText}>Track Pickup</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.actionButton, styles.scanButton]}
        onPress={() => {
          // Reset all scanning-related states when starting a new scan
          setScanning(true);
          setIsVerifying(false);
          setLastScannedCode(null);
          setScannedPickupCode(null);
          setIsAlertShowing(false);
        }}
      >
        <Text style={styles.actionButtonText}>
          {scanning ? "Cancel Scan" : "Scan QR Code"}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCamera = () => {
    if (!scanning) return null;

    return (
      <View style={styles.cameraContainer}>
        <QRScanner
          onBarCodeScanned={
            !isVerifying && !isAlertShowing ? handleBarCodeScanned : () => {}
          }
          onCancel={() => {
            // Reset all states when canceling
            setScanning(false);
            setIsVerifying(false);
            setLastScannedCode(null);
            setScannedPickupCode(null);
            setIsAlertShowing(false);
          }}
        />
        {isVerifying && (
          <View style={styles.verifyingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.verifyingText}>Verifying QR Code...</Text>
          </View>
        )}
      </View>
    );
  };

  useEffect(() => {
    console.log("Current user data:", user);
    console.log("Is parent user?", isParentUser());

    initialize();
  }, [user]);

  const verifyAndAddStudent = async () => {
    try {
      // 1. Basic validation checks
      const userId = getUserId();
      if (!userId) {
        Alert.alert(
          "Authentication Error",
          "Please ensure you are logged in before adding students"
        );
        return;
      }

      // 2. Input validation
      const trimmedCode = studentCode.trim().toUpperCase();
      if (!trimmedCode) {
        Alert.alert("Invalid Input", "Please enter a valid student code");
        return;
      }

      // 3. Check if code format is valid (assuming codes are 6 characters)
      if (trimmedCode.length !== 6) {
        Alert.alert(
          "Invalid Code Format",
          "Student code must be 6 characters long"
        );
        return;
      }

      // 4. Check if student is already linked
      const existingStudent = linkedStudents.find(
        (student) => student.code === trimmedCode
      );

      if (existingStudent) {
        Alert.alert(
          "Already Linked",
          `This student (${existingStudent.name}) is already linked to your account`
        );
        return;
      }

      // 5. Verify the student code exists
      try {
        const verifyResponse = await axios.get(
          `http://192.168.100.3:5000/api/parent-student-links/verify/${trimmedCode}`
        );

        if (!verifyResponse.data.success) {
          Alert.alert(
            "Invalid Code",
            "The entered student code does not exist in our system"
          );
          return;
        }

        // 6. Create the link
        try {
          const createLinkResponse = await axios.post(
            "http://192.168.100.3:5000/api/parent-student-links",
            {
              parentId: userId,
              uniqueCode: trimmedCode,
            }
          );

          if (createLinkResponse.data.success) {
            const newStudent = {
              code: createLinkResponse.data.data.code,
              name: createLinkResponse.data.data.name,
              linkId: createLinkResponse.data.data.linkId,
            };

            // Update state and storage
            setLinkedStudents((prev) => [...prev, newStudent]);

            // Store in AsyncStorage for persistence
            const updatedStudents = [...linkedStudents, newStudent];
            await AsyncStorage.setItem(
              "linkedStudents",
              JSON.stringify(updatedStudents)
            );

            // Reset form and close modal
            setStudentCode("");
            setShowAddModal(false);

            Alert.alert(
              "Success",
              `${newStudent.name} has been successfully linked to your account`
            );
          }
        } catch (linkError) {
          // Handle specific link creation errors
          if (linkError.response?.status === 409) {
            Alert.alert(
              "Already Linked",
              "This student is already linked to another account"
            );
          } else if (linkError.response?.status === 403) {
            Alert.alert(
              "Link Not Allowed",
              "You are not authorized to link this student"
            );
          } else {
            throw linkError; // Pass other errors to main error handler
          }
        }
      } catch (verifyError) {
        if (verifyError.response?.status === 404) {
          Alert.alert(
            "Invalid Code",
            "The provided student code was not found"
          );
        } else {
          throw verifyError; // Pass other errors to main error handler
        }
      }
    } catch (error) {
      console.error("Error in verifyAndAddStudent:", error);

      // Handle network errors
      if (!error.response) {
        Alert.alert(
          "Connection Error",
          "Please check your internet connection and try again"
        );
        return;
      }

      // Handle other errors with specific messages
      const errorMessage =
        error.response?.data?.message || "An unexpected error occurred";
      Alert.alert(
        "Error",
        `Failed to link student: ${errorMessage}. Please try again later.`
      );
    }
  };

  const getUserId = () => {
    if (!user) {
      console.log("No user object found");
      return null;
    }

    console.log("Getting ID for user:", JSON.stringify(user, null, 2));

    // For driver users
    if (user.isDriver || user.driver || user.data?.driver) {
      const driverData = user.driver || user.data?.driver;
      if (driverData?.id) {
        console.log("Using driver ID:", driverData.id);
        return driverData.id;
      }
    }

    // For direct access to id
    if (user.data?.id) {
      console.log("Using user.data.id:", user.data.id);
      return user.data.id;
    }

    if (user.id) {
      console.log("Using user.id:", user.id);
      return user.id;
    }

    // Log full user structure if no ID found
    console.error("No ID found in user object:", JSON.stringify(user, null, 2));
    return null;
  };

  // Modified initialize function
  const initialize = async () => {
    try {
      console.log("Starting initialization...");
      if (!user) {
        console.log("No user data available for initialization");
        setIsInitialized(true);
        return;
      }

      // Debug user object
      console.log("User object structure:", JSON.stringify(user, null, 2));

      let userId;
      // For driver users, use parentId directly
      if (user.isDriver || user.driver || user.data?.driver) {
        const driverData = user.driver || user.data?.driver;
        if (driverData?.parentId) {
          userId = driverData.parentId;
          console.log("Using driver's parentId:", userId);
        }
      } else {
        // For parent users
        userId = getUserId();
        console.log("Using parent userId:", userId);
      }

      if (!userId) {
        console.error("Failed to get valid userId");
        setIsInitialized(true);
        return;
      }

      try {
        const response = await axios.get(
          `http://192.168.100.3:5000/api/parent-student-links/${userId}`
        );

        console.log("API Response:", response.data);

        if (response.data.success) {
          console.log("Successfully loaded students:", response.data.data);

          // Validate data structure before setting
          const validLinks = response.data.data.every(
            (link) => link && link.code && link.name && link.linkId
          );

          if (validLinks) {
            setLinkedStudents(response.data.data);
            await AsyncStorage.setItem(
              "linkedStudents",
              JSON.stringify(response.data.data)
            );
          } else {
            console.error("Invalid link data structure:", response.data.data);
          }
        } else {
          console.error(
            "API request successful but returned error:",
            response.data
          );
        }
      } catch (error) {
        console.error("API request failed:", error);
        if (error.response) {
          console.error("Error response:", error.response.data);
        }

        // Try to load from AsyncStorage as fallback
        try {
          const storedStudents = await AsyncStorage.getItem("linkedStudents");
          if (storedStudents) {
            setLinkedStudents(JSON.parse(storedStudents));
          }
        } catch (storageError) {
          console.error("AsyncStorage fallback failed:", storageError);
        }
      }

      setIsInitialized(true);
    } catch (error) {
      console.error("Initialization error:", error);
      setIsInitialized(true);
    }
  };

  // Update initialize function
  // In your HomeScreen.js
  // In HomeScreen.js
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (user) {
          console.log("Auth loaded with user data:", user);
          setIsAuthLoaded(true);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      }
    };

    checkAuth();
  }, [user]);

  // Separate useEffect for initialization
  useEffect(() => {
    if (isAuthLoaded && user) {
      console.log("Starting initialization with user:", user);
      initialize();
    }
  }, [isAuthLoaded, user]);

  // Update isParentUser to match the actual data structure
  const isParentUser = () => {
    if (!user) {
      console.log("No user found in isParentUser check");
      return false;
    }

    const userData = user.data || user;
    console.log("Checking user type with data:", userData);

    // Check specifically for the driver property
    if (userData.driver) {
      console.log("User identified as driver");
      return false;
    }

    console.log("User identified as parent");
    return true;
  };

  const removeStudent = async (linkId) => {
    // First confirm with the user
    const confirmDelete = () => {
      return new Promise((resolve) => {
        Alert.alert(
          "Remove Student",
          "Are you sure you want to remove this student? This action cannot be undone.",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => resolve(false),
            },
            {
              text: "Remove",
              style: "destructive",
              onPress: () => resolve(true),
            },
          ]
        );
      });
    };

    const shouldDelete = await confirmDelete();
    if (!shouldDelete) return;

    try {
      // Show loading state

      const response = await axios.delete(
        `http://192.168.100.3:5000/api/parent-student-links/${linkId}`
      );

      if (response.data.success) {
        // Update local state
        setLinkedStudents((prevStudents) =>
          prevStudents.filter((student) => student.linkId !== linkId)
        );

        // Show success message
        Alert.alert("Success", "Student has been removed successfully");
      } else {
        throw new Error(response.data.message || "Failed to remove student");
      }
    } catch (error) {
      console.error("Error removing student:", error);

      // Show specific error message if available
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          error.message ||
          "Failed to remove student. Please try again later."
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
          {/* {__DEV__ && ` (${student.code})`} Show code in development */}
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

      console.log("Getting user info from:", JSON.stringify(user, null, 2));

      // For driver users - based on the actual data structure we see in logs
      if (user.data?.driver) {
        console.log("Found driver data in user.data.driver");
        return {
          name: user.data.driver.name || "Driver",
          email: user.data.driver.email || "",
          profilePicture: null,
        };
      }

      // For parent users and fallback
      const userData = user.data || user;
      return {
        name: userData.name || userData.displayName || "User",
        email: userData.email || "",
        profilePicture: userData.profilePicture || userData.picture || null,
      };
    };

    if (!showDropdown) return null;

    const userInfo = getUserInfo();
    console.log("User info for dropdown:", userInfo);

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

  return (
    <ThemedView style={styles.container}>
      <TouchableWithoutFeedback onPress={handleGlobalPress}>
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/images/logo-2.png")}
              style={{ width: 40, height: 40, objectFit: "contain" }}
            />
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
          <View>
            <Text style={styles.userTypeText}>
              {isParentUser() ? "Parent Account" : "Driver Account"}
            </Text>
          </View>

          <ProfileDropdown />

          <ScrollView
            style={styles.mainScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {isParentUser() ? (
              <>
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

                <View style={styles.studentsContainer}>
                  {linkedStudents.map((student, index) =>
                    renderStudentItem(student, index)
                  )}
                </View>
              </>
            ) : (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Assigned Students</Text>
                </View>
                {linkedStudents.length > 0 ? (
                  <View style={styles.studentsContainer}>
                    {linkedStudents.map((student, index) => (
                      <View
                        key={`student-${student.linkId}-${index}`}
                        style={[styles.studentItem, styles.driverStudentItem]}
                      >
                        <View style={styles.studentInfo}>
                          <Text style={styles.studentName}>
                            {student.name || "No name available"}
                          </Text>
                        </View>
                        <View style={styles.studentStatus}>
                          <Text style={styles.statusText}>Active</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>
                      No students assigned yet
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Students will appear here once they are assigned to you
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Camera Button and Scanner */}
          {renderActionButton()}

          {renderCamera()}
          {isParentUser() && (
            <>
              <Modal
                animationType="fade"
                transparent={true}
                visible={showAddModal}
                onRequestClose={() => setShowAddModal(false)}
              >
                <TouchableWithoutFeedback
                  onPress={() => setShowAddModal(false)}
                >
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
                          <Text style={styles.submitButtonText}>
                            Add Student
                          </Text>
                        </TouchableOpacity>
                      </ThemedView>
                    </TouchableWithoutFeedback>
                  </ThemedView>
                </TouchableWithoutFeedback>
              </Modal>
            </>
          )}
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
          <PickupConfirmationModal
            isOpen={showConfirmationModal}
            onClose={() => setShowConfirmationModal(false)}
            onConfirm={submitPickupRequest}
            onCancel={handleCancelPickup}
            selectedStudents={linkedStudents.filter((student) =>
              selectedStudents.includes(student.linkId)
            )}
            isSubmitting={isSubmittingPickup}
          />
        </View>
      </TouchableWithoutFeedback>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  mainScrollView: {
    flex: 1,
  },

  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  studentsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  driverStudentItem: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },

  studentInfo: {
    flex: 1,
  },

  studentCode: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 4,
  },

  studentStatus: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  statusText: {
    color: "#2e7d32",
    fontSize: 12,
    fontWeight: "600",
  },

  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 40,
  },

  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },

  emptyStateSubtext: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  verifyingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  verifyingText: {
    color: "#ffffff",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  scanButton: {
    backgroundColor: "#4CAF50",
  },
  trackButton: {
    backgroundColor: "#2196F3",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  studentsList: {
    flex: 1,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
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
    marginTop: 10,
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
  cameraContainer: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    marginTop: 20,
    position: "relative",
  },
  cancelScanButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 15,
    borderRadius: 8,
  },
  cancelScanText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  retryButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
  },
  userTypeText: {
    fontSize: 14,
    color: "green",
    marginBottom: 5,
  },
  studentDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  noStudentsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});
