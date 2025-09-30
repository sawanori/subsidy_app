import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Jest用のafterEachを使用（Vitestではない）
afterEach(() => {
  cleanup();
});