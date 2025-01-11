import { render, screen, act } from "@testing-library/react";
import Dashboard from "../app/dashboard/page";

// Minimal mocks for external libraries
jest.mock("axios", () => ({
  get: jest.fn((url) => {
    if (url.includes("/api/students/count")) {
      return Promise.resolve({ data: { count: 100 } });
    } else if (url.includes("/api/students/parent-count")) {
      return Promise.resolve({ data: { count: 50 } });
    } else if (url.includes("/api/notifications")) {
      return Promise.resolve({
        data: [
          {
            title: "Announcement 1",
            description: "Description 1",
            createdAt: new Date(),
          },
          {
            title: "Announcement 2",
            description: "Description 2",
            createdAt: new Date(),
          },
          {
            title: "Announcement 3",
            description: "Description 3",
            createdAt: new Date(),
          },
          {
            title: "Announcement 4",
            description: "Description 4",
            createdAt: new Date(),
          },
        ],
      });
    }
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn() }),
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  UsersIcon: () => <div>UsersIcon</div>,
  ClockIcon: () => <div>ClockIcon</div>,
  MegaphoneIcon: () => <div>MegaphoneIcon</div>,
  DeleteIcon: () => <div>DeleteIcon</div>,
  Bell: () => <div>Bell</div>,
  TrendingUp: () => <div>TrendingUp</div>,
  Calendar: () => <div>Calendar</div>,
  AlertTriangle: () => <div>AlertTriangle</div>,
  Cloud: () => <div>Cloud</div>,
  X: () => <div>X</div>,
  XIcon: () => <div>XIcon</div>,
  QrCode: () => <div>QrCode</div>,
  Activity: () => <div>Activity</div>,
  Trash2: () => <div>Trash2</div>,
  Badge: () => <div>Badge</div>,
}));

// Mock UI component libraries
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }) => <div>{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardContent: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <div>{children}</div>,
  CardDescription: ({ children }) => <div>{children}</div>,
}));

jest.mock("antd", () => ({
  Modal: ({ children }) => <div>{children}</div>,
  Spin: () => <div>Loading</div>,
  notification: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Drawer: ({ children }) => <div>{children}</div>,
  List: ({ children }) => <div>{children}</div>,
  Table: ({ ...props }) => <table {...props}>Table</table>,
}));

// Mock analytics components
jest.mock("@/components/component/QrGeneration", () => () => (
  <div>QRCodeGenerator</div>
));
jest.mock("@/components/component/DynamicWeatherWidget", () => () => (
  <div>WeatherWidget</div>
));
jest.mock("@/components/component/RealTimePickupDrawer", () => () => (
  <div>RealtimePickupDrawer</div>
));
jest.mock("@/components/component/PickupChart", () => () => (
  <div>PickupCharts</div>
));

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the dashboard header", () => {
    render(<Dashboard />);
    expect(screen.getByText("School Dashboard")).toBeInTheDocument();
  });

  it("renders main dashboard sections", async () => {
    render(<Dashboard />);

    await act(async () => {
      await Promise.resolve();
      // Allow state updates to be processed
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(screen.getByText("Total number of students")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();

    expect(screen.getByText("Total number of Guardians")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();

    expect(screen.getByText("Announcements Sent")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders QR code generator", () => {
    render(<Dashboard />);
    expect(screen.getByText("QRCodeGenerator")).toBeInTheDocument();
  });

  it("renders weather widget", () => {
    render(<Dashboard />);
    expect(screen.getByText("WeatherWidget")).toBeInTheDocument();
  });

  it("renders pickup charts", () => {
    render(<Dashboard />);
    expect(screen.getByText("PickupCharts")).toBeInTheDocument();
  });
});
