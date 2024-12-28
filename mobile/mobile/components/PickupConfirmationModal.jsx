import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { ThemedView } from "./ThemedView";

// In PickupConfirmationModal.jsx
const PickupConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  selectedStudents,
  isSubmitting,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <ThemedView style={styles.centeredView}>
          <TouchableWithoutFeedback>
            <ThemedView style={styles.modalView}>
              <Text style={styles.modalTitle}>Confirm Pickup Status</Text>

              <View style={styles.studentListContainer}>
                <Text style={styles.subtitle}>Selected Students:</Text>
                <ScrollView style={styles.studentList}>
                  {selectedStudents.map((student) => (
                    <Text key={student.code} style={styles.studentItem}>
                      • {student.name}
                    </Text>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.confirmText}>
                Have you picked up these students?
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel Pickup</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={onConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirm Pickup</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ThemedView>
          </TouchableWithoutFeedback>
        </ThemedView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  studentListContainer: {
    width: "100%",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  studentList: {
    maxHeight: 120,
  },
  studentItem: {
    fontSize: 16,
    marginBottom: 8,
    paddingLeft: 10,
  },
  confirmText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    borderRadius: 10,
    padding: 12,
    width: "48%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PickupConfirmationModal;
