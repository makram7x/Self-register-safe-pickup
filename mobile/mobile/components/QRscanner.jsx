import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";

const QRScanner = ({ onBarCodeScanned, onCancel }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    console.log("QRScanner mounted. Permission status:", permission?.granted);
    // Reset scanning state when component mounts
    setIsScanning(true);
    return () => {
      console.log("QRScanner unmounted");
      setIsScanning(false);
    };
  }, []);

  const handleBarCodeScanned = (result) => {
    console.log("Scan detected!");
    console.log("Scan type:", result.type);
    console.log("Scan data:", result.data);

    if (!isScanning) return; // Prevent multiple scans

    setIsScanning(false); // Disable scanning temporarily
    // Call the parent's handler
    onBarCodeScanned(result);
  };

  const handleCancel = () => {
    setIsScanning(false);
    onCancel();
  };

  if (!permission) {
    console.log("Camera permissions are loading...");
    return (
      <View style={styles.container}>
        <Text>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    console.log("Camera permissions not granted. Showing request UI.");
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to use the camera
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={async () => {
            console.log("Requesting camera permission...");
            const result = await requestPermission();
            console.log("Permission request result:", result);
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log(
    "Camera permission granted, rendering camera view. Scanning state:",
    isScanning
  );

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableZoomGesture
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
        onCameraReady={() => {
          console.log("Camera is ready for scanning");
          setIsScanning(true); // Enable scanning when camera is ready
        }}
        onMountError={(error) => {
          console.error("Camera mount error:", error);
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <Text style={styles.scanText}>
              {isScanning
                ? "Position QR code in this area"
                : "Processing scan..."}
            </Text>
          </View>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel Scan</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
    aspectRatio: 16 / 9,
  },
  message: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 20,
  },
  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 10,
    margin: 50,
  },
  cancelButton: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  scanText: {
    color: "white",
    fontSize: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 10,
    borderRadius: 8,
    textAlign: "center",
  },
});

export default QRScanner;
