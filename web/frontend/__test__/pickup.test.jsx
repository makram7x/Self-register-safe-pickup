// pickup.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PickupPage from "../app/pickup/page";
import { act } from "react"; // Changed to import from 'react' instead of 'react-dom/test-utils'
import axios from "axios";
import { Tabs } from "antd";

// Mock antd components
jest.mock("antd", () => ({
  Tabs: ({ items }) => (
    <div>
      {items?.map((item) => (
        <div key={item.key} role="tabpanel">
          {item.children}
        </div>
      ))}
    </div>
  ),
  Tag: ({ children }) => <span>{children}</span>,
  Tooltip: ({ children }) => <>{children}</>,
  notification: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock axios
jest.mock("axios");

const mockPickupLogs = [
  {
    _id: "1",
    studentNames: "John Doe",
    studentCodes: "ABC123",
    parent: {
      name: "Jane Doe",
      email: "jane@example.com",
    },
    status: "pending",
    pickupTime: new Date().toISOString(),
  },
];

describe("PickupPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default axios response with organized data structure
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: mockPickupLogs,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders pickup page title", async () => {
    await act(async () => {
      render(<PickupPage />);
    });
    expect(screen.getByText("Student Pickup Log")).toBeInTheDocument();
  });

  test("displays search input", async () => {
    await act(async () => {
      render(<PickupPage />);
    });

    const searchInput = screen.getByPlaceholderText(/search by student/i);
    expect(searchInput).toBeInTheDocument();
  });

  test("displays pickup logs", async () => {
    await act(async () => {
      render(<PickupPage />);
    });

    // Wait for the data to load and be organized into tabs
    await waitFor(() => {
      // Check for the student's name
      const studentNameCell = screen.getByText("John Doe");
      expect(studentNameCell).toBeInTheDocument();

      // Check for the student's code
      const studentCodeCell = screen.getByText("ABC123");
      expect(studentCodeCell).toBeInTheDocument();

      // Check for the parent's name
      const parentNameCell = screen.getByText("Jane Doe");
      expect(parentNameCell).toBeInTheDocument();
    });
  });

  test("handles refresh button click", async () => {
    await act(async () => {
      render(<PickupPage />);
    });

    const refreshButton = screen.getByText("Refresh");
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    expect(axios.get).toHaveBeenCalledWith(
      "http://localhost:5000/api/pickup/logs"
    );
  });

  test("handles search functionality", async () => {
    await act(async () => {
      render(<PickupPage />);
    });

    const searchInput = screen.getByPlaceholderText(/search by student/i);
    const searchButton = screen.getByText("Search");

    // Type in search input
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "John" } });
    });

    // Click search button
    await act(async () => {
      fireEvent.click(searchButton);
    });

    // Verify filtered results
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  test("shows delete confirmation modal", async () => {
    await act(async () => {
      render(<PickupPage />);
    });

    const deleteButton = screen.getByText("Delete All Logs");

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    expect(screen.getByText("Delete All Pickup Logs")).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to delete all pickup logs/i)
    ).toBeInTheDocument();
  });
});
