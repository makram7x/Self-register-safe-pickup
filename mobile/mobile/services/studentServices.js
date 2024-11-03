// File: frontend/src/services/studentServices.js
import axios from "axios";

const API_URL = "http://localhost:5000";

export const studentServices = {
  verifyAndAddStudent: async (studentCode, user, linkedStudents) => {
    const trimmedStudentCode = studentCode.trim();

    try {
      const verifyResponse = await axios.get(
        `${API_URL}/api/parent-student-links/verify/${trimmedStudentCode}`
      );

      if (!verifyResponse.data.success) {
        throw new Error("Invalid student code");
      }

      if (linkedStudents.some((s) => s.code === trimmedStudentCode)) {
        throw new Error("This student is already linked to your account");
      }

      const linkData = {
        parentId: user._id,
        uniqueCode: trimmedStudentCode,
        studentName: verifyResponse.data.data.studentName,
      };

      const linkResponse = await axios.post(
        `${API_URL}/api/parent-student-links`,
        linkData
      );

      if (linkResponse.data.success) {
        return {
          code: trimmedStudentCode,
          name: verifyResponse.data.data.studentName,
          linkId: linkResponse.data.data._id,
        };
      } else {
        throw new Error("Failed to save link in database");
      }
    } catch (error) {
      throw error;
    }
  },

  loadLinkedStudents: async (userId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/parent-student-links/${userId}`
      );

      if (response.data.success) {
        return response.data.data.map((link) => ({
          code: link.uniqueCode,
          name: link.studentName,
          linkId: link._id,
        }));
      }
      throw new Error("Failed to load linked students");
    } catch (error) {
      throw error;
    }
  },

  removeStudentLink: async (linkId) => {
    try {
      await axios.delete(`${API_URL}/api/parent-student-links/${linkId}`);
      return true;
    } catch (error) {
      throw error;
    }
  },
};

// File: frontend/src/screens/HomeScreen.jsx
// Only showing the relevant functions to add to your existing HomeScreen.jsx

