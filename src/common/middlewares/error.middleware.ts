import { Request, Response, NextFunction } from "express";

class ApiError extends Error {
  statusCode: number;
  error: Error;

  constructor(error: Error, statusCode: number = 500) {
    super(error.message);
    this.error = error;
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorMiddleware = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || err.error || "An unexpected error occurred",
  });
};

export { errorMiddleware, ApiError };
