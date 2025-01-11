import "@testing-library/jest-native/extend-expect";
import "jest-fetch-mock";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock Reanimated
jest.mock("react-native-reanimated", () => ({
  default: {
    addWhitelistedNativeProps: () => {},
    createAnimatedComponent: (component) => component,
    call: () => {},
    Value: jest.fn(),
    event: jest.fn(),
  },
}));

// Mock Animated from react-native
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.Animated.timing = () => ({
    start: jest.fn(),
  });
  RN.Animated.spring = () => ({
    start: jest.fn(),
  });
  return RN;
});

// Mock expo modules
jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

jest.mock("expo-constants", () => ({
  Constants: { manifest: {} },
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
}));

// Mock auth context
jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    signIn: jest.fn(),
    signOut: jest.fn(),
  }),
}));

// Mock WebBrowser
jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock Google auth
jest.mock("expo-auth-session/providers/google", () => ({
  useAuthRequest: () => [null, null, jest.fn()],
}));

// Setup fetch mock
global.fetch = jest.fn();
