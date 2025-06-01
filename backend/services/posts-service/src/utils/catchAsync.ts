import { NextFunction, Request, RequestHandler, Response } from 'express';
import AppError from './appError';

/**
 * Bọc một hàm bất đồng bộ để xử lý lỗi và chuyển tiếp chúng đến middleware xử lý lỗi của Express
 * @param fn Hàm bất đồng bộ cần được bọc
 * @returns Một hàm mới có khả năng xử lý lỗi
 */
const catchAsync = <T extends RequestHandler>(
  fn: T
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

export default catchAsync;
