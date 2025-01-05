// jest.setup.js
import "@testing-library/jest-dom";
import React from "react";

// Mock matchMedia
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

// Mock URL
global.URL.createObjectURL = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = require("resize-observer-polyfill");

// Mock Radix UI components
jest.mock("@radix-ui/react-dropdown-menu", () => ({
  Root: ({ children }) => <div>{children}</div>,
  Trigger: ({ children }) => <div>{children}</div>,
  Content: ({ children }) => <div>{children}</div>,
  Item: ({ children }) => <div>{children}</div>,
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ChevronDownIcon: () => <span data-testid="chevron-down-icon">▼</span>,
  SearchIcon: () => <span data-testid="search-icon">🔍</span>,
  Bell: () => <span data-testid="bell-icon">🔔</span>,
  Calendar: () => <span data-testid="calendar-icon">📅</span>,
  CheckIcon: () => <span data-testid="check-icon">✓</span>,
  XIcon: () => <span data-testid="x-icon">✕</span>,
  DeleteIcon: () => <span data-testid="delete-icon">🗑</span>,
  UsersIcon: () => <span data-testid="users-icon">👥</span>,
  ClockIcon: () => <span data-testid="clock-icon">⏰</span>,
  MegaphoneIcon: () => <span data-testid="megaphone-icon">📢</span>,
  TrendingUp: () => <span data-testid="trending-up-icon">📈</span>,
}));

// Mock socket.io-client
jest.mock("socket.io-client", () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };
  return {
    io: jest.fn(() => mockSocket),
    connect: jest.fn(() => mockSocket),
    default: jest.fn(() => mockSocket),
  };
});

// Mock antd components
jest.mock("antd", () => ({
  notification: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Modal: ({ children, open, onOk, onCancel, title }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
        <button onClick={onOk}>OK</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
  Drawer: ({ children, open, onClose }) =>
    open ? (
      <div role="complementary">
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
  Tabs: ({ children, items }) => (
    <div role="tablist">
      {items?.map((item) => (
        <div key={item.key} role="tabpanel">
          {item.children}
        </div>
      ))}
    </div>
  ),
  Tag: ({ children, color }) => (
    <span className={`ant-tag ant-tag-${color}`}>{children}</span>
  ),
  Tooltip: ({ children, title }) => <div title={title}>{children}</div>,
  Checkbox: ({ children, checked, onChange, indeterminate }) => (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        data-indeterminate={indeterminate}
      />
      {children}
    </label>
  ),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    forEach: jest.fn(),
  }),
}));

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, className }) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }) => (
    <div onClick={onSelect} role="menuitem">
      {children}
    </div>
  ),
  DropdownMenu: ({ children }) => <div>{children}</div>,
}));

// Mock custom components
jest.mock("@/components/component/QrGeneration", () => {
  return {
    __esModule: true,
    default: function MockQRComponent() {
      return <div data-testid="qr-generator">QR Generator</div>;
    },
  };
});

jest.mock("@/components/component/DynamicWeatherWidget", () => {
  return {
    __esModule: true,
    default: function MockWeatherWidget() {
      return <div data-testid="weather-widget">Weather Widget</div>;
    },
  };
});

jest.mock("@/components/component/RealTimePickupDrawer", () => {
  return {
    __esModule: true,
    default: function MockPickupDrawer() {
      return <div data-testid="pickup-drawer">Pickup Drawer</div>;
    },
  };
});

jest.mock("@/components/component/AnnoucementModal", () => {
  return {
    __esModule: true,
    default: ({ open, onClose, onSubmit }) =>
      open ? (
        <div data-testid="announcement-modal">
          <h2>Create Announcement</h2>
          <button
            onClick={() =>
              onSubmit({
                title: "New Announcement",
                description: "New Description",
                icon: "megaphone",
              })
            }
          >
            Submit
          </button>
          <button onClick={onClose}>Close</button>
        </div>
      ) : null,
  };
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
