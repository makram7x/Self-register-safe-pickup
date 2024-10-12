import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Button,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { ThemedView } from "../../components/ThemedView";
import { ThemedText } from "../../components/ThemedText";
import { QrCode } from "lucide-react-native";
import axios from "axios"; // Make sure to install axios: npm install axios

export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [studentCode, setStudentCode] = useState("");
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanning(false);
    setScannedData(data);
    setShowInputModal(true);
  };

  const verifyStudentCode = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/students/unique/${studentCode}`
      );
      const students = response.data;
      const student = students.find((s) => s.uniqueCode === studentCode);

      if (student) {
        setStudentName(student.studentName);
        setShowInputModal(false);
        setShowSuccessModal(true);
      } else {
        Alert.alert("Error", "Invalid student code. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying student code:", error);
      Alert.alert("Error", "Failed to verify student code. Please try again.");
    }
  };

  const closeInputModal = () => {
    setShowInputModal(false);
    setStudentCode("");
    setScannedData(null);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setStudentName("");
    setStudentCode("");
  };

  if (hasPermission === null) {
    return <ThemedText>Requesting for camera permission</ThemedText>;
  }
  if (hasPermission === false) {
    return <ThemedText>No access to camera</ThemedText>;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Code with Beto</ThemedText>

      {!scanning && !showInputModal && !showSuccessModal && (
        <>
          <QrCode size={200} color="#000000" style={styles.qrPlaceholder} />

          <ThemedText style={styles.instructions}>
            Press the button below to scan a QR code
          </ThemedText>
        </>
      )}

      <Button
        title={scanning ? "Cancel Scan" : "Scan QR Code"}
        onPress={() => setScanning(!scanning)}
        disabled={showInputModal || showSuccessModal}
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
        visible={showInputModal}
        onRequestClose={closeInputModal}
      >
        <TouchableWithoutFeedback onPress={closeInputModal}>
          <ThemedView style={styles.centeredView}>
            <TouchableWithoutFeedback>
              <ThemedView style={styles.modalView}>
                <ThemedText style={styles.modalText}>
                  Enter Student Unique Code
                </ThemedText>
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
                  onPress={verifyStudentCode}
                >
                  <ThemedText style={styles.submitButtonText}>
                    Submit
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </TouchableWithoutFeedback>
          </ThemedView>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={closeSuccessModal}
      >
        <TouchableWithoutFeedback onPress={closeSuccessModal}>
          <ThemedView style={styles.centeredView}>
            <TouchableWithoutFeedback>
              <ThemedView style={styles.modalView}>
                <ThemedText style={styles.modalText}>
                  Student {studentName} has been successfully picked up.
                </ThemedText>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={closeSuccessModal}
                >
                  <ThemedText style={styles.submitButtonText}>OK</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </TouchableWithoutFeedback>
          </ThemedView>
        </TouchableWithoutFeedback>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  qrPlaceholder: {
    marginBottom: 20,
  },
  instructions: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
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
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
  },
  input: {
    height: 40,
    width: "100%",
    marginVertical: 12,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  submitButton: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  submitButtonText: {
    fontWeight: "bold",
    textAlign: "center",
  },
});
