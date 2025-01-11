// LoginScreen.test.jsx
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import LoginScreen from "../app/login";
import * as Google from "expo-auth-session/providers/google";

// Mock the dependencies
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("expo-auth-session/providers/google", () => ({
  useAuthRequest: jest.fn(),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

jest.mock("expo-constants", () => ({
  appOwnership: "expo",
}));

describe("LoginScreen", () => {
  // Setup common mocks
  const mockRouter = {
    replace: jest.fn(),
  };
  const mockSignIn = jest.fn();
  const mockPromptAsync = jest.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    useRouter.mockReturnValue(mockRouter);
    useAuth.mockReturnValue({ signIn: mockSignIn });
    Google.useAuthRequest.mockReturnValue([null, null, mockPromptAsync]);

    // Mock fetch globally
    global.fetch = jest.fn();
  });

  // Test Parent Login Form
  describe("Parent Login Form", () => {
    it("renders parent login form by default", () => {
      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      expect(getByPlaceholderText("Email")).toBeTruthy();
      expect(getByPlaceholderText("Password")).toBeTruthy();
      expect(getByText("Login")).toBeTruthy();
    });

    it("handles parent login submission", async () => {
      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      // Fill in the form
      fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
      fireEvent.changeText(getByPlaceholderText("Password"), "password123");

      // Mock successful API response
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                user: {
                  id: "1",
                  email: "test@example.com",
                },
                token: "mock-token",
              },
            }),
        })
      );

      // Submit the form
      fireEvent.press(getByText("Login"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "http://192.168.100.3:5000/api/auth/login",
          expect.any(Object)
        );
      });
    });

    it("shows error message on failed login", async () => {
      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              message: "Invalid credentials",
            }),
        })
      );

      fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
      fireEvent.changeText(getByPlaceholderText("Password"), "wrongpassword");
      fireEvent.press(getByText("Login"));

      await waitFor(() => {
        expect(
          getByText("Authentication failed. Please try again.")
        ).toBeTruthy();
      });
    });
  });

  // Test Driver Login Form
  describe("Driver Login Form", () => {
    it("switches to driver login form", () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.press(getByText("Driver"));

      expect(getByPlaceholderText("Email")).toBeTruthy();
      expect(getByPlaceholderText("Password")).toBeTruthy();
    });

    it("handles driver login submission", async () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      // Switch to driver form
      fireEvent.press(getByText("Driver"));

      // Fill in the form
      fireEvent.changeText(getByPlaceholderText("Email"), "driver@example.com");
      fireEvent.changeText(getByPlaceholderText("Password"), "driverpass123");

      // Mock successful API response
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                driver: {
                  id: "1",
                  name: "John Driver",
                  email: "driver@example.com",
                  isDriver: true,
                },
                token: "mock-driver-token",
              },
            }),
        })
      );

      // Submit the form
      fireEvent.press(getByText("Login"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "http://192.168.100.3:5000/api/drivers/login",
          expect.any(Object)
        );
      });
    });
  });

  // Test Registration Flow
  describe("Registration Flow", () => {
    it("switches between login and register forms", () => {
      const { getByText, queryByPlaceholderText } = render(<LoginScreen />);

      // Switch to register
      fireEvent.press(getByText("Don't have an account? Register"));
      expect(queryByPlaceholderText("Full Name")).toBeTruthy();

      // Switch back to login
      fireEvent.press(getByText("Already have an account? Login"));
      expect(queryByPlaceholderText("Full Name")).toBeNull();
    });

    it("validates password match in registration", async () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      // Switch to register
      fireEvent.press(getByText("Don't have an account? Register"));

      // Fill form with mismatched passwords
      fireEvent.changeText(getByPlaceholderText("Email"), "new@example.com");
      fireEvent.changeText(getByPlaceholderText("Password"), "password123");
      fireEvent.changeText(
        getByPlaceholderText("Confirm Password"),
        "password456"
      );

      fireEvent.press(getByText("Register"));

      await waitFor(() => {
        expect(getByText("Passwords do not match")).toBeTruthy();
      });
    });
  });

  // Test Google Sign In
  describe("Google Sign In", () => {
    it("handles successful Google sign in", async () => {
      const { getByText } = render(<LoginScreen />);

      mockPromptAsync.mockResolvedValueOnce({
        type: "success",
        authentication: { accessToken: "mock-google-token" },
      });

      global.fetch
        // Mock Google API response
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                sub: "google-123",
                name: "Google User",
                email: "google@example.com",
                picture: "profile-pic-url",
              }),
          })
        )
        // Mock your server response
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                user: {
                  id: "1",
                  email: "google@example.com",
                },
              }),
          })
        );

      fireEvent.press(getByText("Sign in with Google"));

      await waitFor(() => {
        expect(mockPromptAsync).toHaveBeenCalled();
      });
    });

    it("handles Google sign in error", async () => {
      const { getByText } = render(<LoginScreen />);

      mockPromptAsync.mockRejectedValueOnce(new Error("Google sign in failed"));

      fireEvent.press(getByText("Sign in with Google"));

      await waitFor(() => {
        expect(getByText("Failed to start sign in process")).toBeTruthy();
      });
    });
  });

  // Test Form Validation
  describe("Form Validation", () => {
    it("validates required fields", async () => {
      const { getByText } = render(<LoginScreen />);

      // Try to submit empty form
      fireEvent.press(getByText("Login"));

      await waitFor(() => {
        expect(getByText("Please fill in all required fields")).toBeTruthy();
      });
    });

    it("validates email format", async () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText("Email"), "invalid-email");
      fireEvent.changeText(getByPlaceholderText("Password"), "password123");

      fireEvent.press(getByText("Login"));

      await waitFor(() => {
        expect(
          getByText("Authentication failed. Please try again.")
        ).toBeTruthy();
      });
    });
  });
});
