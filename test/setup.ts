import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Set NODE_ENV to 'test'
process.env.NODE_ENV = 'test';

// Ensure test directory exists
const testConfigDir = path.dirname('/tmp/test-mcp-config.json');
if (!fs.existsSync(testConfigDir)) {
    fs.mkdirSync(testConfigDir, { recursive: true });
}

// Mock console.error to keep test output clean
console.error = jest.fn();
