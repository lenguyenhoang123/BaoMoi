import { beforeAll, jest } from '@jest/globals';
import dotenv from 'dotenv';
import { join } from 'path';
import { Request, Response, NextFunction } from 'express';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

// Extend the global namespace to include our test utilities
declare global {
  // eslint-disable-next-line no-var
  var mockRequest: (body?: any, params?: any, query?: any, headers?: any) => Partial<Request> & {
    user?: { id: number; email: string; role: string };
  };
  // eslint-disable-next-line no-var
  var mockResponse: () => Partial<Response> & {
    status: jest.Mock;
    json: jest.Mock;
    send: jest.Mock;
    end: jest.Mock;
  };
  // eslint-disable-next-line no-var
  var mockNext: jest.Mock<NextFunction>;
}

// First, create the mock object with proper typing
const mockCategory = {
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  scope: jest.fn().mockReturnThis(),
};

// Then set up the mock for the module
jest.mock('../../src/models/category.model', () => ({
  Category: mockCategory,
}));

// Finally, export the mock with proper typing
export { mockCategory };

// Global test setup
beforeAll(() => {
  // Setup code that runs once before all tests
  jest.setTimeout(10000);
  
  // Setup global test utilities
  global.mockRequest = (body = {}, params = {}, query = {}, headers = {}) => ({
    body,
    params,
    query,
    headers,
    user: { id: 1, email: 'test@example.com', role: 'admin' },
    get: (header: string) => headers[header.toLowerCase()],
  });

  global.mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    res.send = jest.fn().mockReturnThis();
    res.end = jest.fn().mockReturnThis();
    return res;
  };

  global.mockNext = jest.fn();
});

// Export the mock functions
export { mockRequest, mockResponse, mockNext };
