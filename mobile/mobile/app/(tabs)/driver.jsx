import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { PlusCircle, User, X } from "lucide-react-native";

export default function DriversScreen() {
  // States
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [verificationCode, setVerificationCode] = useState(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Effects
  useEffect(() => {
    loadDrivers();
  }, []);

  // Data loading functions
  const loadDrivers = async () => {
    try {
      const parentId = user.data?.id || user.id;
      if (!parentId) {
        console.error("No parent ID found");
        return;
      }

      const response = await axios.get(
        `http://192.168.100.3:5000/api/drivers/parent/${parentId}`
      );

      if (response.data.success) {
        setDrivers(response.data.data);
      }
    } catch (error) {
      console.error("Error loading drivers:", error);
      Alert.alert(
        "Error",
        "Failed to load drivers. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateDriver = () => {
    if (!newDriver.name.trim()) {
      Alert.alert("Error", "Please enter driver's name");
      return false;
    }
    if (!newDriver.email.trim()) {
      Alert.alert("Error", "Please enter driver's email");
      return false;
    }
    if (!newDriver.phone.trim()) {
      Alert.alert("Error", "Please enter driver's phone number");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newDriver.email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }
    return true;
  };

  // Handler functions
  const handleAddDriverModal = (show) => {
    // Don't allow opening add modal if verification modal is open
    if (show && showVerificationModal) {
      return;
    }

    setShowAddModal(show);

    // Reset form when closing
    if (!show) {
      setNewDriver({ name: "", email: "", phone: "" });
    }
  };

  const handleAddDriver = async () => {
    if (!validateDriver()) return;

    setIsSubmitting(true);
    try {
      const parentId = user.data?.id || user.id;
      if (!parentId) {
        throw new Error("Parent ID not found");
      }

      const response = await axios.post(
        "http://192.168.100.3:5000/api/drivers",
        {
          ...newDriver, // This will now have the complete form data
          parentId,
        }
      );

      if (response.data.success) {
        setDrivers((prev) => [...prev, response.data.data.driver]);
        handleAddDriverModal(false);
        Alert.alert(
          "Success",
          `Driver added successfully!\n\nVerification Code: ${response.data.data.verificationCode}\n\nPlease share this code with your driver to complete registration.`
        );
      }
    } catch (error) {
      console.error("Error adding driver:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to add driver"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

    const handleDriverPress = async (driver) => {
      if (driver.isRegistered) {
        Alert.alert("Driver Status", "This driver is already registered.");
        return;
      }

      try {
        setLoadingCode(true);
        const response = await axios.get(
          `http://192.168.100.3:5000/api/drivers/${driver._id}/code`
        );

        if (response.data.success) {
          setSelectedDriver(driver);
          setVerificationCode(response.data.verificationCode);
          setShowVerificationModal(true);
        } else {
          Alert.alert("Error", "Could not retrieve verification code");
        }
      } catch (error) {
        console.error("Error fetching verification code:", error);
        Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to fetch verification code"
        );
      } finally {
        setLoadingCode(false);
      }
    };
  const closeVerificationModal = () => {
    setShowVerificationModal(false);
    setTimeout(() => {
      setSelectedDriver(null);
      setVerificationCode(null);
      setLoadingCode(false);
    }, 300);
  };

  const handleRemoveDriver = async (driverId, driverName) => {
    Alert.alert(
      "Remove Driver",
      `Are you sure you want to remove ${driverName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await axios.delete(
                `http://192.168.100.3:5000/api/drivers/${driverId}`
              );

              if (response.data.success) {
                setDrivers((prev) =>
                  prev.filter((driver) => driver._id !== driverId)
                );
                Alert.alert("Success", "Driver removed successfully");
              }
            } catch (error) {
              console.error("Error removing driver:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to remove driver"
              );
            }
          },
        },
      ]
    );
  };

  // Render functions
  const renderDriver = (driver) => (
    <TouchableOpacity
      key={driver._id}
      style={styles.driverItem}
      onPress={() => handleDriverPress(driver)}
      activeOpacity={0.7}
    >
      <View style={styles.driverInfo}>
        <View
          style={[
            styles.driverIconContainer,
            driver.isRegistered && styles.registeredDriverIcon,
          ]}
        >
          <User size={24} color={driver.isRegistered ? "#fff" : "#666"} />
        </View>
        <View style={styles.driverDetails}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.driverEmail}>{driver.email}</Text>
          <Text style={styles.driverPhone}>{driver.phone}</Text>
          <Text
            style={[
              styles.driverStatus,
              driver.isRegistered
                ? styles.registeredStatus
                : styles.pendingStatus,
            ]}
          >
            {driver.isRegistered ? "Active" : "Tap to view verification code"}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={(e) => {
          e.stopPropagation();
          handleRemoveDriver(driver._id, driver.name);
        }}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Modal Components
 const AddDriverModal = () => {
   // Local state for form inputs and loading
   const [formData, setFormData] = useState({
     name: "",
     email: "",
     phone: "",
   });
   const [localSubmitting, setLocalSubmitting] = useState(false);

   // Reset form when modal closes
   useEffect(() => {
     if (!showAddModal) {
       setFormData({ name: "", email: "", phone: "" });
       setLocalSubmitting(false);
     }
   }, [showAddModal]);

   const validateFormData = () => {
     if (!formData.name.trim()) {
       Alert.alert("Error", "Please enter driver's name");
       return false;
     }
     if (!formData.email.trim()) {
       Alert.alert("Error", "Please enter driver's email");
       return false;
     }
     if (!formData.phone.trim()) {
       Alert.alert("Error", "Please enter driver's phone number");
       return false;
     }
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(formData.email.trim())) {
       Alert.alert("Error", "Please enter a valid email address");
       return false;
     }
     return true;
   };

   const handleSubmit = async () => {
     if (!validateFormData() || localSubmitting) return;

     setLocalSubmitting(true);
     try {
       const parentId = user.data?.id || user.id;
       if (!parentId) {
         throw new Error("Parent ID not found");
       }

       const response = await axios.post(
         "http://192.168.100.3:5000/api/drivers",
         {
           ...formData,
           parentId,
         }
       );

       if (response.data.success) {
         // Update drivers list using a callback to ensure we have latest state
         setDrivers((currentDrivers) => [
           ...currentDrivers,
           response.data.data.driver,
         ]);

         // Close modal first
         handleAddDriverModal(false);

         // Show success alert after a brief delay to ensure smooth transition
         setTimeout(() => {
           Alert.alert(
             "Success",
             `Driver added successfully!\n\nVerification Code: ${response.data.data.verificationCode}\n\nPlease share this code with your driver to complete registration.`
           );
         }, 100);
       }
     } catch (error) {
       console.error("Error adding driver:", error);
       Alert.alert(
         "Error",
         error.response?.data?.message || "Failed to add driver"
       );
     } finally {
       setLocalSubmitting(false);
     }
   };

   return (
     <Modal
       visible={showAddModal}
       animationType="slide"
       transparent={true}
       onRequestClose={() => !localSubmitting && handleAddDriverModal(false)}
     >
       <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
         <View style={styles.modalContainer}>
           <KeyboardAvoidingView
             behavior={Platform.OS === "ios" ? "padding" : "height"}
             style={{ flex: 1 }}
             keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
           >
             <View style={styles.modalOverlayDriver}>
               <View style={[styles.modalContent, { maxHeight: "95%" }]}>
                 <View style={styles.modalHeader}>
                   <Text style={styles.modalTitle}>Add New Driver</Text>
                   <TouchableOpacity
                     style={styles.closeButton}
                     onPress={() =>
                       !localSubmitting && handleAddDriverModal(false)
                     }
                     disabled={localSubmitting}
                   >
                     <X size={24} color="#666" />
                   </TouchableOpacity>
                 </View>

                 <ScrollView
                   keyboardShouldPersistTaps="handled"
                   contentContainerStyle={{ paddingBottom: 20 }}
                 >
                   <TextInput
                     style={[
                       styles.input,
                       localSubmitting && styles.inputDisabled,
                     ]}
                     placeholder="Driver Name"
                     value={formData.name}
                     onChangeText={(text) =>
                       setFormData((prev) => ({ ...prev, name: text }))
                     }
                     placeholderTextColor="#999"
                     returnKeyType="next"
                     editable={!localSubmitting}
                   />

                   <TextInput
                     style={[
                       styles.input,
                       localSubmitting && styles.inputDisabled,
                     ]}
                     placeholder="Email"
                     value={formData.email}
                     onChangeText={(text) =>
                       setFormData((prev) => ({ ...prev, email: text }))
                     }
                     keyboardType="email-address"
                     autoCapitalize="none"
                     placeholderTextColor="#999"
                     returnKeyType="next"
                     editable={!localSubmitting}
                   />

                   <TextInput
                     style={[
                       styles.input,
                       localSubmitting && styles.inputDisabled,
                     ]}
                     placeholder="Phone Number"
                     value={formData.phone}
                     onChangeText={(text) =>
                       setFormData((prev) => ({ ...prev, phone: text }))
                     }
                     keyboardType="phone-pad"
                     placeholderTextColor="#999"
                     returnKeyType="done"
                     editable={!localSubmitting}
                   />

                   <TouchableOpacity
                     style={[
                       styles.submitButton,
                       localSubmitting && styles.submitButtonDisabled,
                     ]}
                     onPress={handleSubmit}
                     disabled={localSubmitting}
                   >
                     {localSubmitting ? (
                       <ActivityIndicator size="small" color="#fff" />
                     ) : (
                       <Text style={styles.submitButtonText}>Add Driver</Text>
                     )}
                   </TouchableOpacity>
                 </ScrollView>
               </View>
             </View>
           </KeyboardAvoidingView>
         </View>
       </TouchableWithoutFeedback>
     </Modal>
   );
 };

  const VerificationCodeModal = () => (
    <Modal
      visible={showVerificationModal}
      transparent={true}
      animationType="fade"
      onRequestClose={closeVerificationModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.verificationModalContent}>
          <Text style={styles.verificationModalTitle}>
            Driver Verification Code
          </Text>
          {loadingCode ? (
            <ActivityIndicator
              size="large"
              color="#4CAF50"
              style={styles.codeLoading}
            />
          ) : (
            <>
              <Text style={styles.driverNameLabel}>{selectedDriver?.name}</Text>
              <View style={styles.codeContainer}>
                <Text style={styles.verificationCode}>{verificationCode}</Text>
              </View>
              <Text style={styles.codeInstructions}>
                Share this code with your driver to complete their registration
              </Text>
            </>
          )}
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={closeVerificationModal}
          >
            <Text style={styles.closeModalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Main render
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Drivers</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddDriverModal(true)}
          >
            <PlusCircle size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : (
          <ScrollView
            style={styles.driversList}
            showsVerticalScrollIndicator={false}
          >
            {drivers.length > 0 ? (
              drivers.map(renderDriver)
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No drivers added yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Add drivers to help with student pickups
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        <AddDriverModal />
        <VerificationCodeModal />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  addButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  driversList: {
    flex: 1,
  },
  driverItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  driverIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  registeredDriverIcon: {
    backgroundColor: "#4CAF50",
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  driverEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  driverStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  registeredStatus: {
    color: "#4CAF50",
  },
  pendingStatus: {
    color: "#FFA000",
  },
  removeButton: {
    backgroundColor: "#fee2e2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  removeButtonText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center", // Changed from flex-end to center
    alignItems: "center", // Added this to center horizontally
  },
  modalOverlayDriver: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  verificationModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "90%",
    maxWidth: 340,
    alignSelf: "center", // Added this to ensure center alignment
    marginHorizontal: 20, // Added this to ensure proper spacing
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        paddingBottom: 36,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  closeButton: {
    padding: 4,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    color: "#1a1a1a",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  verificationModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "90%",
    maxWidth: 340,
  },
  verificationModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  driverNameLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  codeContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    width: "100%",
    alignItems: "center",
  },
  verificationCode: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4CAF50",
    letterSpacing: 2,
  },
  codeInstructions: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  closeModalButton: {
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
  },
  closeModalButtonText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  codeLoading: {
    marginVertical: 40,
  },
  inputDisabled: {
    backgroundColor: "#f1f3f5",
    color: "#adb5bd",
  },
});
