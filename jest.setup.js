// Jest setup file
// Mock logger to avoid console output during tests
jest.mock('./src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Global test setup
beforeAll(() => {
  // Setup global test environment
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
});

afterAll(() => {
  // Cleanup after all tests
});