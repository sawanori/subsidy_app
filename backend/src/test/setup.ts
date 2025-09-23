// Test setup file for Jest
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test database URL if not provided
if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/subsidy_test';
}

// Global test setup
beforeAll(async () => {
  // Global setup if needed
});

afterAll(async () => {
  // Global cleanup if needed
});

// Increase timeout for integration tests
jest.setTimeout(30000);