// notifications.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Notifications from "../app/notifications/page";
import { act } from "react";

// Mock the external components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, className }) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/component/AnnoucementModal", () => {
  const MockAnnouncementModal = ({ open, onClose, onSubmit }) => {
    if (!open) return null;
    return (
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
    );
  };
  return MockAnnouncementModal;
});

// Mock data
const mockAnnouncements = [
  {
    _id: "1",
    title: "Test Announcement",
    description: "Test Description",
    icon: "megaphone",
    createdAt: new Date().toISOString(),
  },
];

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockAnnouncements),
  })
);

describe("Notifications Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset fetch mock implementation
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAnnouncements),
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders announcements title", async () => {
    await act(async () => {
      render(<Notifications />);
    });
    expect(screen.getByText("Announcements")).toBeInTheDocument();
  });

  it("displays create announcement button", async () => {
    await act(async () => {
      render(<Notifications />);
    });

    const button = screen.getByText("Create New Announcement");
    expect(button).toBeInTheDocument();
  });

  it("displays announcements", async () => {
    await act(async () => {
      render(<Notifications />);
    });

    await waitFor(() => {
      expect(screen.getByText("Test Announcement")).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
    });
  });

  it("opens announcement creation modal", async () => {
    await act(async () => {
      render(<Notifications />);
    });

    const button = screen.getByText("Create New Announcement");

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByTestId("announcement-modal")).toBeInTheDocument();
  });

  it("handles announcement creation", async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnnouncements),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              _id: "2",
              title: "New Announcement",
              description: "New Description",
              icon: "megaphone",
            }),
        })
      );

    await act(async () => {
      render(<Notifications />);
    });

    const createButton = screen.getByText("Create New Announcement");

    await act(async () => {
      fireEvent.click(createButton);
    });

    const submitButton = screen.getByText("Submit");

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/notifications",
        expect.any(Object)
      );
    });
  });

  it("handles select all functionality", async () => {
    await act(async () => {
      render(<Notifications />);
    });

    await waitFor(() => {
      expect(screen.getByText("Test Announcement")).toBeInTheDocument();
    });

    const selectAllLabel = screen.getByText(/select all/i);
    const selectAllCheckbox = selectAllLabel
      .closest("label")
      .querySelector('input[type="checkbox"]');

    await act(async () => {
      fireEvent.click(selectAllCheckbox);
    });

    expect(screen.getByText("Delete Selected")).toBeInTheDocument();
  });
});
