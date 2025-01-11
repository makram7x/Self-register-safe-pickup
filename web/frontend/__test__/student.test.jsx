// student.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StudentPage from "../app/student/page";
import { act } from "react-dom/test-utils";
import axios from "axios";

// Mock axios
jest.mock("axios");

// Mock all UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, className }) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children }) => <h2>{children}</h2>,
  CardDescription: ({ children }) => <p>{children}</p>,
  CardHeader: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ type, placeholder, value, onChange, className }) => (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
    />
  ),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }) => (
    <div onClick={onSelect}>{children}</div>
  ),
  DropdownMenuLabel: ({ children }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

jest.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }) => <div>{children}</div>,
  AvatarImage: ({ src, alt }) => <img src={src} alt={alt} />,
  AvatarFallback: ({ children }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/table", () => ({
  Table: ({ children }) => <table>{children}</table>,
  TableHeader: ({ children }) => <thead>{children}</thead>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableHead: ({ children }) => <th>{children}</th>,
  TableRow: ({ children }) => <tr>{children}</tr>,
  TableCell: ({ children }) => <td>{children}</td>,
}));

// Mock antd components
jest.mock("antd", () => ({
  message: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ChevronDownIcon: () => <span>▼</span>,
  SearchIcon: () => <span>🔍</span>,
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock the FileUploadErrorModal component
jest.mock("@/components/component/fileUploadErrorModal", () => ({
  __esModule: true,
  default: ({ isOpen, onClose, errors }) =>
    isOpen ? <div>Error Modal</div> : null,
}));

// Mock student data
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
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default axios responses
    axios.get.mockResolvedValue({ data: mockStudents });
  });

  it("renders student management page with initial data", async () => {
    await act(async () => {
      render(<StudentPage />);
    });

    // Wait for the title to be rendered
    await waitFor(() => {
      expect(screen.getByText("Students Management")).toBeInTheDocument();
    });

    // Verify that axios.get was called to fetch students
    expect(axios.get).toHaveBeenCalledWith(
      "http://localhost:5000/api/students"
    );
  });

  it("displays student data in the table", async () => {
    await act(async () => {
      render(<StudentPage />);
    });

    // Wait for the student name to appear in the table
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Check for parent name
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("opens and closes the Add Student modal", async () => {
    await act(async () => {
      render(<StudentPage />);
    });

    // Find and click the Add Student button (using button role and text)
    const addButton = screen.getByRole("button", { name: /add student/i });
    await act(async () => {
      fireEvent.click(addButton);
    });

    // Check if modal is open by looking for the form label
    expect(screen.getByLabelText("Student's Full Name")).toBeInTheDocument();

    // Modal title should be visible
    expect(
      screen.getByRole("heading", { name: /add student/i })
    ).toBeInTheDocument();

    // Find and click the Cancel button
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Verify modal is closed
    await waitFor(() => {
      expect(
        screen.queryByLabelText("Student's Full Name")
      ).not.toBeInTheDocument();
    });
  });

  it("shows student details when Show Details is clicked", async () => {
    await act(async () => {
      render(<StudentPage />);
    });

    // Wait for the table to load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Find and click the Show Details button
    const showDetailsButton = screen.getByText("Show Details");
    await act(async () => {
      fireEvent.click(showDetailsButton);
    });

    // Verify that detailed information is shown
    expect(screen.getByText("Parent Phone:")).toBeInTheDocument();
    expect(screen.getByText("123-456-7890")).toBeInTheDocument();
  });

  it("filters students based on search input", async () => {
    await act(async () => {
      render(<StudentPage />);
    });

    // Wait for the initial render
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Get the search input
    const searchInput = screen.getByPlaceholderText("Search...");

    // Type in the search input
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "John" } });
    });

    // Click the search button (using the icon)
    const searchButton = screen.getByText("🔍");
    await act(async () => {
      fireEvent.click(searchButton);
    });

    // Verify the filtered results
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
