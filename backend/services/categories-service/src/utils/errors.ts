export class NotFoundError extends Error {
  statusCode: number;
  
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class ValidationError extends Error {
  statusCode: number;
  errors: Record<string, string[]>;
  
  constructor(errors: Record<string, string[]>) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.errors = errors;
  }
}

export class UnauthorizedError extends Error {
  statusCode: number;
  
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

export class ForbiddenError extends Error {
  statusCode: number;
  
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}
