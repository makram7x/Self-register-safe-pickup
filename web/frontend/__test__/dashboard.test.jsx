// dashboard.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Dashboard from "../app/dashboard/page";
import { act } from "react";
import axios from "axios";

// Mock modules
jest.mock("axios");

// Mock socket.io-client properly
jest.mock("socket.io-client", () => {
  const mockOn = jest.fn();
  const mockOff = jest.fn();
  const mockDisconnect = jest.fn();

  return {
    io: () => ({
      on: mockOn,
      off: mockOff,
      disconnect: mockDisconnect,
    }),
  };
});

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock components that use external libraries
jest.mock("@/components/component/QrGeneration", () => {
  return function MockQRGenerator() {
    return <div data-testid="qr-generator">QR Generator</div>;
  };
});

jest.mock("@/components/component/DynamicWeatherWidget", () => {
  return function MockWeatherWidget() {
    return <div data-testid="weather-widget">Weather Widget</div>;
  };
});

jest.mock("@/components/component/RealTimePickupDrawer", () => {
  return function MockPickupDrawer() {
    return <div data-testid="pickup-drawer">Pickup Drawer</div>;
  };
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("Dashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default axios responses
    axios.get.mockImplementation((url) => {
      switch (true) {
        case url.includes("/api/students/count"):
          return Promise.resolve({ data: { count: 45 } });
        case url.includes("/api/students/parent-count"):
          return Promise.resolve({ data: { count: 987 } });
        case url.includes("/api/pickup/logs"):
          return Promise.resolve({
            data: {
              success: true,
              data: [],
            },
          });
        default:
          return Promise.resolve({ data: [] });
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders dashboard title", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    expect(screen.getByText("School Dashboard")).toBeInTheDocument();
  });

  it("displays current date", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    const today = new Date().toLocaleDateString();
    expect(screen.getByText(today)).toBeInTheDocument();
  });

  it("displays student count", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      const studentCard = screen.getAllByText("45")[0];
      expect(studentCard).toBeInTheDocument();
    });
  });

  it("opens notification drawer on bell click", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const bellElement = screen.getByRole("button", {
      name: /notifications/i,
    });

    await act(async () => {
      fireEvent.click(bellElement);
    });

    expect(screen.getByTestId("pickup-drawer")).toBeInTheDocument();
  });

  it("displays QR code generator", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    expect(screen.getByTestId("qr-generator")).toBeInTheDocument();
  });

  it("displays weather widget", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    expect(screen.getByTestId("weather-widget")).toBeInTheDocument();
  });
});
