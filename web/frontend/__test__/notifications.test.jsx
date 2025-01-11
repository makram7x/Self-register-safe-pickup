// notifications.test.jsx
import { render, screen } from "@testing-library/react";
import Notifications from "../app/notifications/page";

// Simple mocks
jest.mock("antd", () => ({
  Checkbox: ({ children }) => (
    <label>
      <input type="checkbox" />
      {children}
    </label>
  ),
  message: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }) => <div>{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardContent: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <div>{children}</div>,
}));

jest.mock("@/components/component/AnnoucementModal", () => {
  return function Modal({ open }) {
    if (!open) return null;
    return <div>Modal</div>;
  };
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve([
        {
          _id: "1",
          title: "Test",
          description: "Test",
          createdAt: new Date().toISOString(),
        },
      ]),
  })
);

describe("Notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<Notifications />);
    expect(screen.getByText("Announcements")).toBeInTheDocument();
  });

  it("shows create button", () => {
    render(<Notifications />);
    expect(screen.getByText("Create New Announcement")).toBeInTheDocument();
  });
});
