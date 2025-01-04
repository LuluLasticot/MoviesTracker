// jest.config.ts
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',   // ou "jsdom" si tu testes du code DOM
  // roots: ['<rootDir>/tests'] // Indique où se trouvent tes tests
};
export default config;
