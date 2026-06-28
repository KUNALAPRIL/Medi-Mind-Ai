import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import logger from '../config/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const correlationId = req.headers['x-correlation-id'] || 'no-correlation-id';

  if (err instanceof AppError) {
    logger.warn(`[AppError] [CorrelationID: ${correlationId}] Status: ${err.statusCode} - ${err.message}`);
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  logger.error(`[UnhandledError] [CorrelationID: ${correlationId}] Stack: ${err.stack}`);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  });
};

export default errorHandler;
