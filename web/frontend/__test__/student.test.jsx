// student.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudentPage from "../app/student/page";
import { act } from "react-dom/test-utils";
import axios from "axios";

// Mock the modules
jest.mock("axios");

const mockStudents = [
  {
    _id: "1",
    studentName: "John Doe",
    parentName: "Jane Doe",
    grade: "5",
    parentPhone: "123-456-7890",
    parentEmail: "jane@example.com",
    uniqueCode: "ABC123",
  },
];

describe("StudentPage Component", () => {
  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup default axios responses
    axios.get.mockResolvedValue({ data: mockStudents });
  });

  test("renders student management page", async () => {
    await act(async () => {
      render(<StudentPage />);
    });
    expect(screen.getByText("Students Management")).toBeInTheDocument();
  });

  test("displays Add Student button", async () => {
    await act(async () => {
      render(<StudentPage />);
    });
    expect(screen.getByText("Add Student")).toBeInTheDocument();
  });

  test("opens student form modal", async () => {
    await act(async () => {
      render(<StudentPage />);
    });

    const addButton = screen.getByText("Add Student");
    await act(async () => {
      fireEvent.click(addButton);
    });

    expect(screen.getByText("Student's Full Name")).toBeInTheDocument();
  });

  test("opens CSV upload modal", async () => {
    await act(async () => {
      render(<StudentPage />);
    });

    const uploadButton = screen.getByText("Upload CSV");
    await act(async () => {
      fireEvent.click(uploadButton);
    });

    expect(screen.getByText("Upload Excel or CSV File")).toBeInTheDocument();
  });

  test("displays delete all confirmation modal", async () => {
    await act(async () => {
      render(<StudentPage />);
    });

    const deleteAllButton = screen.getByText("Delete All Students");
    await act(async () => {
      fireEvent.click(deleteAllButton);
    });

    const modalText = screen.getByText(
      /are you sure you want to delete all students/i
    );
    expect(modalText).toBeInTheDocument();
  });
});
